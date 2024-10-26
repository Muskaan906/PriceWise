import Product from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongoose";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";
import { scrapeAmazonProduct } from "@/lib/scraper";
import { getAveragePrice, getEmailNotifType, getHighestPrice, getLowestPrice } from "@/lib/utils";
import { NextResponse } from "next/server";

// Set to 50 seconds to give some buffer before Vercel's 60-second limit
export const maxDuration = 50;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = async () => {
  try {
    await connectToDB();

    // Get only products that haven't been updated in the last 24 hours
    const currentTime = new Date();
    const products = await Product.find({
      lastChecked: { 
        $lt: new Date(currentTime.getTime() - 24 * 60 * 60 * 1000) 
      }
    }).limit(5); // Process 5 products at a time

    if (!products || products.length === 0) {
      return NextResponse.json({
        message: 'No products need updating',
        data: []
      });
    }

    const updatedProducts = await Promise.all(
      products.map(async (current) => {
        try {
          const scrapedProduct = await scrapeAmazonProduct(current.url);

          if (!scrapedProduct) {
            console.log(`Skipping product ${current.url} - no data found`);
            return current;
          }

          const updatedPriceHistory = [
            ...current.priceHistory,
            { price: scrapedProduct.currentPrice, date: new Date() }
          ];

          // Keep only last 30 days of price history
          const thirtyDaysAgo = new Date(currentTime.getTime() - 30 * 24 * 60 * 60 * 1000);
          const trimmedPriceHistory = updatedPriceHistory.filter(
            (record: any) => new Date(record.date) >= thirtyDaysAgo
          );

          const product = {
            ...scrapedProduct,
            priceHistory: trimmedPriceHistory,
            lowestPrice: getLowestPrice(trimmedPriceHistory),
            highestPrice: getHighestPrice(trimmedPriceHistory),
            averagePrice: getAveragePrice(trimmedPriceHistory),
            lastChecked: new Date(),
          };

          const updatedProduct = await Product.findOneAndUpdate(
            { url: scrapedProduct.url },
            product,
            { new: true }
          );

          // Handle email notifications
          if (updatedProduct && updatedProduct.users.length > 0) {
            const emailNotifType = getEmailNotifType(scrapedProduct, current);
            
            if (emailNotifType) {
              const productInfo = {
                title: updatedProduct.title,
                url: updatedProduct.url
              };

              const emailContent = generateEmailBody(productInfo, emailNotifType);
              const userEmails = updatedProduct.users.map((user: any) => user.email);
              
              // Send emails asynchronously without waiting
              sendEmail(emailContent, userEmails).catch(console.error);
            }
          }

          return updatedProduct;
        } catch (error) {
          console.error(`Error processing product ${current.url}:`, error);
          return current;
        }
      })
    );

    return NextResponse.json({
      message: 'Ok',
      data: updatedProducts
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({
      message: 'Error',
      error: (error as Error).message
    }, { status: 500 });
  }
};