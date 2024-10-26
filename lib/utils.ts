import { PriceHistoryItem, Product } from "@/types";
import { Notification } from "@/lib/nodemailer";
import { THRESHOLD_PERCENTAGE } from "@/lib/nodemailer";

export function extractPrice(...elements: any): string {
  if (!elements || elements.length === 0) return '';
  for (const element of elements) {
    if (!element || !element.text) continue;
    const priceText = element.text().trim();
    if (priceText) {
      const match = priceText.match(/\$?(\d+(?:\.\d{2})?)/);
      if (match) return match[1];
    }
  }
  return '';
}

function convertToNumber(str: string): number {
  if (!str) return 0;
  return parseInt(str.replace(/,/g, ''), 10) || 0;
}

export function extractReviewsCount(review: string): number {
  if (!review) return 0;
  const reviewAmount = review.split(" ");
  return convertToNumber(reviewAmount[0]);
}

export function extractCurrency(element: any): string {
  if (!element || !element.text) return '';
  const currencyText = element.text().trim().slice(0, 1);
  return currencyText || '';
}

export function extractDescription($: any): string {
  if (!$) return "";
  const selectors = [
    ".a-unordered-list .a-list-item",
    ".a-expander-content p",
  ];

  for (const selector of selectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      return elements
        .map((_: any, element: any) => $(element).text().trim())
        .get()
        .join("\n");
    }
  }

  return "";
}

export function getHighestPrice(priceList: PriceHistoryItem[]): number {
  if (!priceList || priceList.length === 0) return 0;
  return Math.max(...priceList.map(item => item.price));
}

export function getLowestPrice(priceList: PriceHistoryItem[]): number {
  if (!priceList || priceList.length === 0) return 0;
  return Math.min(...priceList.map(item => item.price));
}

export function getAveragePrice(priceList: PriceHistoryItem[]): number {
  if (!priceList || priceList.length === 0) return 0;
  const sumOfPrices = priceList.reduce((acc, curr) => acc + curr.price, 0);
  return sumOfPrices / priceList.length;
}

export const getEmailNotifType = (
  scrapedProduct: Product,
  currentProduct: Product
): keyof typeof Notification | null => {
  if (!scrapedProduct || !currentProduct) return null;
  
  const lowestPrice = getLowestPrice(currentProduct.priceHistory);

  if (scrapedProduct.currentPrice < lowestPrice) {
    return Notification.LOWEST_PRICE as keyof typeof Notification;
  }
  if (!scrapedProduct.isOutOfStock && currentProduct.isOutOfStock) {
    return Notification.CHANGE_OF_STOCK as keyof typeof Notification;
  }
  if (scrapedProduct.discountRate >= THRESHOLD_PERCENTAGE) {
    return Notification.THRESHOLD_MET as keyof typeof Notification;
  }

  return null;
};

export const formatNumber = (num: number = 0): string => {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export const getLowestPricer = (curProd: Product): PriceHistoryItem | null => {
  if (!curProd || !curProd.priceHistory || curProd.priceHistory.length === 0) {
    return null;
  }

  return curProd.priceHistory.reduce((min, current) => 
    current.price < min.price ? current : min
  );
};