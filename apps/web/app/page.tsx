import Link from 'next/link';
import {
  Users,
  Calendar,
  Package,
  Receipt,
  FileText,
  MessageSquare,
  LayoutDashboard,
  UserCog,
  Bell,
  Check,
  Star,
  ArrowLeft,
  Stethoscope,
  ShieldCheck,
  Clock,
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'ניהול לקוחות וחיות',
    description: 'תיקי לקוח מפורטים, היסטוריה רפואית מלאה וחיפוש מהיר במאגר.',
  },
  {
    icon: Calendar,
    title: 'ניהול תורים',
    description: 'לוח שנה חכם, שיבוץ אוטומטי ותזכורות אוטומטיות ללקוחות.',
  },
  {
    icon: Package,
    title: 'מלאי ומחסן',
    description: 'מעקב כמויות בזמן אמת, ניהול תפוגה והתראות מלאי נמוך.',
  },
  {
    icon: Receipt,
    title: 'קופה וחשבוניות',
    description: 'חשבוניות מס, ניהול תשלומים וחיבור לסולק ישראלי.',
  },
  {
    icon: FileText,
    title: 'הצעות מחיר',
    description: 'יצירה מהירה, שליחה ללקוח ואישור אוטומטי בלחיצה.',
  },
  {
    icon: MessageSquare,
    title: 'תקשורת',
    description: 'שליחת הודעות WhatsApp, SMS ואימייל ישירות ללקוחות.',
  },
  {
    icon: LayoutDashboard,
    title: 'דשבורד מנהל',
    description: 'מעקב ביצועים, הכנסות ומגמות בזמן אמת.',
  },
  {
    icon: UserCog,
    title: 'ניהול עובדים',
    description: 'הגדרת תפקידים, הרשאות מותאמות ושיבוץ משמרות.',
  },
  {
    icon: Bell,
    title: 'תזכורות',
    description: 'תזכורות לחיסונים, מעקבים תקופתיים והתראות מותאמות אישית.',
  },
];

const pricingPlans = [
  {
    name: 'בסיסי',
    price: '199',
    description: 'לקליניקות קטנות שרוצות להתחיל בדיגיטל',
    features: [
      'עד 2 משתמשים',
      'ניהול לקוחות וחיות',
      'ניהול תורים',
      'תזכורות בסיסיות',
      'תמיכה באימייל',
    ],
    highlighted: false,
  },
  {
    name: 'מקצועי',
    price: '399',
    description: 'לקליניקות צומחות שרוצות את כל הכלים',
    features: [
      'עד 10 משתמשים',
      'כל התכונות של הבסיסי',
      'קופה וחשבוניות',
      'הצעות מחיר',
      'ניהול מלאי ומחסן',
      'דוחות ודשבורד',
      'תמיכה בטלפון',
    ],
    highlighted: true,
  },
  {
    name: 'ארגוני',
    price: '699',
    description: 'לרשתות ולקליניקות גדולות',
    features: [
      'ללא הגבלת משתמשים',
      'כל התכונות של המקצועי',
      'גישת API מלאה',
      'אינטגרציות מותאמות',
      'תמיכה ייעודית 24/7',
      'הדרכה והטמעה',
    ],
    highlighted: false,
  },
];

const testimonials = [
  {
    name: 'ד"ר מיכל לוי',
    clinic: 'קליניקת חיות המחמד, תל אביב',
    quote:
      'VetFlow שינתה את הדרך שבה אנחנו מנהלים את הקליניקה. התורים מסודרים, הלקוחות מקבלים תזכורות אוטומטיות, ואנחנו חוסכים שעות של עבודה מנהלתית כל שבוע.',
    rating: 5,
  },
  {
    name: 'ד"ר אורן כהן',
    clinic: 'מרפאה וטרינרית הרצליה',
    quote:
      'עברנו מניהול ידני על אקסלים ל-VetFlow ותוך שבוע כבר ראינו שיפור משמעותי. המערכת אינטואיטיבית, מקצועית ומותאמת בדיוק לצרכים שלנו.',
    rating: 5,
  },
  {
    name: 'ד"ר נועה ברק',
    clinic: 'VetCare רמת גן',
    quote:
      'מודול המלאי חסך לנו אלפי שקלים. אנחנו יודעים בדיוק מה יש במחסן, מתי צריך להזמין ומה עומד לפוג. ממליצה בחום לכל קליניקה.',
    rating: 5,
  },
];

export default function HomePage() {
  return (
    <div dir="rtl" className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">
              Vet<span className="text-blue-600">Flow</span>
            </span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-gray-600 transition hover:text-blue-600"
            >
              תכונות
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-gray-600 transition hover:text-blue-600"
            >
              מחירים
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium text-gray-600 transition hover:text-blue-600"
            >
              לקוחות ממליצים
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 transition hover:text-blue-600"
            >
              התחברות
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              הרשמה חינם
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-blue-50 via-white to-blue-50/50 pb-20 pt-20 md:pt-32">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-blue-200 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-blue-100 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            <ShieldCheck className="h-4 w-4" />
            <span>מערכת מאובטחת ומותאמת לשוק הישראלי</span>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-6xl">
            נהלו את הקליניקה
            <br />
            <span className="text-blue-600">הווטרינרית שלכם בקלות</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-600 md:text-xl">
            מערכת ניהול קליניקות All-in-One — לקוחות, חיות, תורים, מלאי,
            חשבוניות, תקשורת ודוחות. הכל במקום אחד, בעברית, עם תמיכה מלאה.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30"
            >
              הרשמה חינם
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-8 py-4 text-lg font-semibold text-gray-700 transition hover:border-blue-200 hover:bg-blue-50"
            >
              למידע נוסף
            </a>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>הקמה תוך דקות</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>ללא התחייבות</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-blue-600" />
              <span>14 ימי ניסיון חינם</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              כל מה שצריך לניהול הקליניקה
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              מערכת מקיפה שמכסה את כל ההיבטים של ניהול קליניקה וטרינרית — מתיאום
              תורים ועד דוחות כספיים.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition hover:border-blue-100 hover:shadow-md"
                >
                  <div className="mb-4 inline-flex rounded-xl bg-blue-50 p-3 text-blue-600 transition group-hover:bg-blue-100">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="leading-relaxed text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              תוכניות ומחירים
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              בחרו את התוכנית שמתאימה לגודל הקליניקה שלכם. כל התוכניות כוללות 14
              ימי ניסיון חינם.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 transition ${
                  plan.highlighted
                    ? 'scale-105 border-blue-600 bg-white shadow-xl shadow-blue-600/10'
                    : 'border-gray-200 bg-white shadow-sm hover:shadow-md'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-sm font-semibold text-white">
                    מומלץ
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="mb-2 text-xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-500">{plan.description}</p>
                </div>
                <div className="mb-8">
                  <span className="text-5xl font-extrabold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="mr-1 text-lg text-gray-500">&#8362;</span>
                  <span className="text-gray-500">/חודש</span>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 text-gray-700"
                    >
                      <Check
                        className={`h-5 w-5 flex-shrink-0 ${
                          plan.highlighted ? 'text-blue-600' : 'text-green-500'
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block w-full rounded-xl py-3.5 text-center font-semibold transition ${
                    plan.highlighted
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700'
                      : 'border-2 border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  התחילו עכשיו
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="bg-gray-50 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              לקוחות ממליצים
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              הצטרפו למאות קליניקות שכבר משתמשות ב-VetFlow לניהול היומיומי.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
              >
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="mb-6 leading-relaxed text-gray-600">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.clinic}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-blue-600 py-20 md:py-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
            מוכנים להתחיל?
          </h2>
          <p className="mb-10 text-lg text-blue-100">
            הצטרפו ל-VetFlow עוד היום והתחילו לנהל את הקליניקה שלכם בצורה חכמה
            ויעילה. 14 ימי ניסיון חינם, ללא התחייבות.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-lg transition hover:bg-blue-50 hover:shadow-xl"
          >
            הרשמה חינם
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                Vet<span className="text-blue-600">Flow</span>
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="#features"
                className="text-sm text-gray-500 transition hover:text-gray-900"
              >
                תכונות
              </a>
              <a
                href="#pricing"
                className="text-sm text-gray-500 transition hover:text-gray-900"
              >
                מחירים
              </a>
              <Link
                href="/login"
                className="text-sm text-gray-500 transition hover:text-gray-900"
              >
                התחברות
              </Link>
              <Link
                href="/register"
                className="text-sm text-gray-500 transition hover:text-gray-900"
              >
                הרשמה
              </Link>
            </div>
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} VetFlow. כל הזכויות שמורות.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
