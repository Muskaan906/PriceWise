import Product from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongoose";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";
import { scrapeAmazonProduct } from "@/lib/scraper";
import { getAveragePrice, getEmailNotifType, getHighestPrice, getLowestPrice } from "@/lib/utils";
import { NextResponse } from "next/server";

// Set maximum duration to 60 seconds (hobby plan limit)
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Process products in smaller batches
const BATCH_SIZE = 5;

export const GET = async () => {
  try {
    await connectToDB();

    // Get all products
    const products = await Product.find({});
    if (!products?.length) {
      return NextResponse.json({ message: 'No products found', data: [] });
    }

    const results = [];
    
    // Process products in batches
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      
      const batchResults = await Promise.all(
        batch.map(async (current) => {
          try {
            const scrapedProduct = await scrapeAmazonProduct(current.url);
            
            if (!scrapedProduct) {
              console.warn(`No data found for product: ${current.url}`);
              return null;
            }

            // Update price history
            const updatedPriceHistory = [
              ...current.priceHistory,
              { price: scrapedProduct.currentPrice, date: new Date() }
            ];

            // Calculate new metrics
            const product = {
              ...scrapedProduct,
              priceHistory: updatedPriceHistory,
              lowestPrice: getLowestPrice(updatedPriceHistory),
              highestPrice: getHighestPrice(updatedPriceHistory),
              averagePrice: getAveragePrice(updatedPriceHistory),
            };

            // Update product in database
            const updatedProduct = await Product.findOneAndUpdate(
              { url: scrapedProduct.url },
              product,
              { new: true }
            );

            // Check if email notification is needed
            const emailNotifType = getEmailNotifType(scrapedProduct, current);
            
            if (emailNotifType && updatedProduct.users?.length > 0) {
              const productInfo = {
                title: updatedProduct.title,
                url: updatedProduct.url
              };

              const emailContent = generateEmailBody(productInfo, emailNotifType);
              const userEmails = updatedProduct.users.map((user: any) => user.email);
              
              // Send emails asynchronously without waiting
              sendEmail(emailContent, userEmails).catch(error => 
                console.error(`Failed to send email for ${updatedProduct.url}:`, error)
              );
            }

            return updatedProduct;
          } catch (error) {
            console.error(`Error processing product ${current.url}:`, error);
            return null;
          }
        })
      );

      results.push(...batchResults.filter(Boolean));
    }

    return NextResponse.json({
      message: 'Products updated successfully',
      data: results,
      processed: results.length,
      total: products.length
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { message: `Error in cron job: ${error}`, error: true },
      { status: 500 }
    );
  }
};