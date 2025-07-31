
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, CheckCircle } from 'lucide-react';
import { EnvoEarnLogo } from '@/components/logo';

const plans = [
  {
    id: 1,
    name: 'Starter Plan',
    price: 6000,
    dailyReturn: 120,
    validity: '4-5 months',
    features: ['120 PKR Daily Return', '4-5 Month Validity', 'Standard Withdrawals'],
    cta: 'Select Plan',
  },
  {
    id: 2,
    name: 'Growth Plan',
    price: 12000,
    dailyReturn: 260,
    validity: '8 months',
    features: ['260 PKR Daily Return', '8 Month Validity', 'Standard Withdrawals'],
    cta: 'Select Plan',
    popular: true,
  },
  {
    id: 3,
    name: 'Pro Investor',
    price: 28000,
    dailyReturn: 540,
    validity: '14 months',
    features: ['540 PKR Daily Return', '14 Month Validity', 'No Withdrawal Limit', '800 PKR Referral Bonus'],
    cta: 'Select Plan',
  },
];

const testimonials = [
  {
    name: 'Ayesha Khan',
    avatar: 'AK',
    review: 'The variety of plans made it easy to start. The daily returns are consistent, and the platform is so easy to use. Highly recommended!',
    rating: 5,
  },
  {
    name: 'Bilal Ahmed',
    avatar: 'BA',
    review: 'I started with the Growth Plan and have been very impressed. The transparency and quick support won me over. Great job!',
    rating: 5,
  },
  {
    name: 'Fatima Ali',
    avatar: 'FA',
    review: 'A fantastic platform for passive income. The referral bonuses on the Pro plan are a great incentive too. I\'ve already invited three of my friends!',
    rating: 5,
  },
];

const Header = () => (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center">
            <Link href="/">
              <EnvoEarnLogo />
            </Link>
        </div>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/signin">Sign In</Link>
          </Button>
        </nav>
      </div>
    </header>
  );

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative pt-32 pb-16 md:pt-48 md:pb-24">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(to_bottom,white,transparent)] dark:bg-grid-slate-700/40"></div>
          <div className="container mx-auto px-4 md:px-6 text-center relative">
            <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter">
              Invest Smart, Earn Daily.
            </h1>
            <p className="mt-4 mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground">
              Check out our plans, choose the one you like, and start earning daily returns.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg" asChild>
                <Link href="#plans">View Our Plans</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="plans" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
             <h2 className="font-headline text-3xl md:text-4xl font-bold text-center">
              Choose Your Investment Plan
            </h2>
             <p className="mt-2 text-center text-muted-foreground max-w-xl mx-auto">
              We offer a range of plans to suit your investment goals.
            </p>
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <Card key={plan.id} className={`flex flex-col ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                   {plan.popular && <div className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider text-center py-1 rounded-t-lg">Most Popular</div>}
                  <CardHeader className="text-center">
                    <h3 className="font-headline text-2xl font-bold">{plan.name}</h3>
                    <p className="text-4xl font-bold">
                      {plan.price.toLocaleString()} <span className="text-lg font-medium text-muted-foreground">PKR</span>
                    </p>
                    <p className="text-sm text-muted-foreground">One-Time Investment</p>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500"/>
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                     <Button asChild className="w-full" size="lg">
                        <Link href={`/invest?plan=${plan.id}&amount=${plan.price}&daily_return=${plan.dailyReturn}`}>
                          {plan.cta}
                        </Link>
                      </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-secondary">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="font-headline text-3xl md:text-4xl font-bold text-center">
              Trusted by Investors Across Pakistan
            </h2>
            <p className="mt-2 text-center text-muted-foreground max-w-xl mx-auto">
              People have selected different plans and are now earning daily returns.
            </p>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={`https://placehold.co/40x40/78A2CC/FFFFFF?text=${testimonial.avatar}`} />
                        <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{testimonial.review}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="py-8 bg-background border-t">
        <div className="container mx-auto px-4 md:px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ENVO-EARN. All rights reserved.</p>
          <p className="text-sm mt-2">This platform is intended for users in Pakistan.</p>
        </div>
      </footer>
    </div>
  );
}
