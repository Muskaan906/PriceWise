import Product from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongoose";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";
import { scrapeAmazonProduct } from "@/lib/scraper";
import { getAveragePrice, getEmailNotifType, getHighestPrice, getLowestPrice } from "@/lib/utils";
import { NextResponse } from "next/server";

export const maxDuration = 300;

export const dynamic = 'force-dynamic';

export const revalidate = 0;

export const GET = async () => {
  try {
    connectToDB();

    const products = await Product.find({});

    if (!products) throw new Error("No products found");

    //1 scrape latest product details and update db
    const updatedProducts = await Promise.all(
      products.map(async (current) => {
        const scrapedProduct = await scrapeAmazonProduct(current.url);

        if (!scrapedProduct) throw new Error("No product found");

          const updatedPriceHistory: any = [
            ...scrapedProduct.priceHistory,
            { price: scrapedProduct.currentPrice },
          ];

          const product = {
            ...scrapedProduct,
            priceHistory: updatedPriceHistory,
            lowestPrice: getLowestPrice(updatedPriceHistory),
            highestPrice: getHighestPrice(updatedPriceHistory),
            averagePrice: getAveragePrice(updatedPriceHistory),
          };
        

        const updatedProduct = await Product.findOneAndUpdate(
            {url:scrapedProduct.url},
            product
        )

        //2 Check each product's status and send email accordingly
        const emailNotifType = getEmailNotifType(scrapedProduct, current);

        if(emailNotifType && updatedProduct.users.length > 0){
            const productInfo = {
                title:updatedProduct.title,
                url:updatedProduct.url
            }

            const emailContent =  generateEmailBody(productInfo, emailNotifType);

            const userEmails = updatedProduct.users.map((user:any) => user.email)

            sendEmail(emailContent, userEmails);


        }

        return updatedProduct;

      })
    );

    return NextResponse.json({
        message:'Ok', data:updatedProducts
    }
    )
  } catch (error) {
    throw new Error(`Error in GET:${error}`);
  }
};
