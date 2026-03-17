import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

const PLANS = [
  {
    id: 'basic',
    name: 'בסיסי',
    price: 199,
    currency: 'ILS',
    interval: 'month',
    features: [
      'עד 2 משתמשים',
      'ניהול לקוחות וחיות',
      'ניהול תורים',
      'תזכורות בסיסיות',
      'דשבורד',
    ],
    maxUsers: 2,
  },
  {
    id: 'professional',
    name: 'מקצועי',
    price: 399,
    currency: 'ILS',
    interval: 'month',
    popular: true,
    features: [
      'עד 10 משתמשים',
      'כל התכונות של בסיסי',
      'קופה וחשבוניות',
      'הצעות מחיר',
      'ניהול מלאי',
      'דוחות ומגמות',
      'תקשורת WhatsApp/SMS',
    ],
    maxUsers: 10,
  },
  {
    id: 'enterprise',
    name: 'ארגוני',
    price: 699,
    currency: 'ILS',
    interval: 'month',
    features: [
      'ללא הגבלת משתמשים',
      'כל התכונות של מקצועי',
      'גישת API',
      'אינטגרציות מותאמות',
      'תמיכה ייעודית',
      'גיבוי מורחב',
    ],
    maxUsers: -1,
  },
];

@ApiTags('Plans')
@Controller('plans')
export class PlansController {
  @Get()
  getPlans() {
    return PLANS;
  }
}
