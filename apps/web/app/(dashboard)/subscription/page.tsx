'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Check, Crown, Building2, Star, CreditCard, CalendarDays } from 'lucide-react';

type PlanId = 'basic' | 'pro' | 'enterprise';

interface Plan {
  id: PlanId;
  name: string;
  price: number;
  icon: typeof Star;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'בסיסי',
    price: 99,
    icon: Star,
    features: [
      '1 וטרינר',
      'עד 100 לקוחות',
      'ניהול תורים',
      'תזכורות SMS',
    ],
  },
  {
    id: 'pro',
    name: 'מקצועי',
    price: 249,
    icon: Crown,
    popular: true,
    features: [
      '5 וטרינרים',
      'לקוחות ללא הגבלה',
      'כל התכונות הבסיסיות',
      'דוחות מתקדמים',
      'WhatsApp',
      'תמיכה טכנית',
    ],
  },
  {
    id: 'enterprise',
    name: 'ארגוני',
    price: 499,
    icon: Building2,
    features: [
      'וטרינרים ללא הגבלה',
      'כל תכונות Pro',
      'API חיצוני',
      'SLA מובטח',
      'מנהל חשבון אישי',
    ],
  },
];

export default function SubscriptionPage() {
  const [currentPlan, setCurrentPlan] = useState<PlanId>('basic');
  const [confirmPlan, setConfirmPlan] = useState<Plan | null>(null);

  const handleSelectPlan = (plan: Plan) => {
    if (plan.id === currentPlan) return;
    setConfirmPlan(plan);
  };

  const handleConfirmUpgrade = () => {
    if (confirmPlan) {
      setCurrentPlan(confirmPlan.id);
      setConfirmPlan(null);
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">ניהול מנוי</h1>
      <p className="mb-8 text-muted-foreground">בחרו את התוכנית המתאימה לקליניקה שלכם</p>

      {/* Plans Grid */}
      <div className="mb-10 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = plan.id === currentPlan;

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col transition-shadow hover:shadow-md ${
                isCurrent
                  ? 'border-blue-500 ring-2 ring-blue-500'
                  : plan.popular
                    ? 'border-blue-200'
                    : ''
              }`}
            >
              {isCurrent && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white hover:bg-blue-600">
                  התוכנית הנוכחית
                </Badge>
              )}
              {plan.popular && !isCurrent && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white hover:bg-amber-500">
                  הכי פופולרי
                </Badge>
              )}
              <CardHeader className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">₪{plan.price}</span>
                  <span className="text-muted-foreground"> / חודש</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="mb-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={isCurrent ? 'outline' : 'default'}
                  disabled={isCurrent}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {isCurrent ? 'התוכנית הנוכחית' : 'בחר תוכנית'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Billing Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            פרטי חיוב
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <CalendarDays className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">תאריך חיוב הבא</p>
                <p className="font-medium">01/05/2026</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <CreditCard className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">אמצעי תשלום</p>
                <p className="font-medium" dir="ltr">**** **** **** 4242</p>
              </div>
            </div>
            <div className="flex items-center sm:col-span-2 lg:col-span-1">
              <Button variant="outline">עדכן פרטי תשלום</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmPlan} onOpenChange={(open) => !open && setConfirmPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>שינוי תוכנית</DialogTitle>
            <DialogDescription>
              {confirmPlan && (
                <>
                  האם ברצונך לעבור לתוכנית <strong>{confirmPlan.name}</strong> בעלות של{' '}
                  <strong>₪{confirmPlan.price}</strong> לחודש?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmPlan(null)}>
              ביטול
            </Button>
            <Button onClick={handleConfirmUpgrade}>אישור שינוי</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
