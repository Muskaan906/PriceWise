import axios from "axios";
import * as cheerio from 'cheerio';
import { extractCurrency, extractDescription, extractPrice, extractReviewsCount } from "../utils";

export const scrapeAmazonProduct = async (url: string) => {
  if (!url) return;
  //curl -i --proxy brd.superproxy.io:22225 
  //--proxy-user brd-customer-hl_e8113e43-zone-pricewise:bhkc578rzy5k -k 
  //"https://geo.brdtest.com/welcome.txt"

  //BrightData proxy configuration
  const username = String(process.env.BRIGHT_DATA_USERNAME);
  const password = String(process.env.BRIGHT_DATA_PASSWORD);
  const port = 22225;
  const session_id = (1000000 * Math.random()) | 0;
  const options = {
    auth:{
        username:`${username}-session-${session_id}`,
        password
    },
    host:'brd.superproxy.io',
    port,
    rejectUnauthorized:false
  }

  try {
    // Fetch the product page
    const response = await axios.get(url, options);
    const $ = cheerio.load(response.data);

    const title = $('#productTitle').text().trim();

    const currentPrice = extractPrice(
        $('span.a-price.a-text-price.a-size-medium.apexPriceToPay'),
        $('.a-price-whole')
    );

    const originalPrice = extractPrice(
        $('#priceblock_ourprice'),
        $('.a-price.a-text-price span.a-offscreen'),
        $('#listPrice'),
        $('#priceblock_dealprice'),
        $('.a-size-base.a-color-price'),
        $('.aok-offscreen')
    )

    const outOfStock = $('#availability span').text().trim().toLowerCase() === 'currently unavailable';
   
    const images = $('#imgBlkFront').attr('data-a-dynamic-image') || 
    $('#landingImage').attr('data-a-dynamic-image') || '{}';

    const imgUrls = Object.keys(JSON.parse(images));

    const currency = extractCurrency($('.a-price-symbol'));

    const discountRate = $('.savingsPercentage').text().replace(/[-%]/g, "");

    const description = extractDescription($);

    const reviewsCount = extractReviewsCount($('span[data-hook="total-review-count"]').text());

    console.log({title},{currentPrice},{originalPrice},{outOfStock},{imgUrls},{currency},{discountRate});
    const data = {
        title,
        url,
        currency:currency || '$',
        image:imgUrls[0],
        currentPrice:Number(currentPrice) || Number(originalPrice),
        originalPrice:Number(originalPrice) || Number(currentPrice),
        priceHistory:[],
        discountRate:Number(discountRate),
        category:'category',
        reviewsCount,
        stars:4.5,
        isOutOfStock:outOfStock,
        description,
        lowestPrice:Number(currentPrice) || Number(originalPrice),
        highestPrice:Number(originalPrice) || Number(currentPrice),
        averagePrice: Number(currentPrice) || Number(originalPrice)
   
      }

      return data;
} catch (error:any) {
    throw new Error(`Failed to scrape product: ${error.message}`)
  }
};
