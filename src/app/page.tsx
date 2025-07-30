
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { EnvoEarnLogo } from '@/components/logo';

const testimonials = [
  {
    name: 'Ayesha Khan',
    avatar: 'AK',
    review: 'ENVO-EARN has been a game-changer for my finances. The daily returns are consistent, and the platform is so easy to use. Highly recommended!',
    rating: 5,
  },
  {
    name: 'Bilal Ahmed',
    avatar: 'BA',
    review: 'I was skeptical at first, but the transparency and quick support won me over. The withdrawal process is smooth. Great job!',
    rating: 5,
  },
  {
    name: 'Fatima Ali',
    avatar: 'FA',
    review: 'A fantastic platform for passive income. The referral bonuses are a great incentive too. I\'ve already invited three of my friends!',
    rating: 5,
  },
  {
    name: 'Usman Malik',
    avatar: 'UM',
    review: 'Finally, an investment platform in Pakistan that delivers what it promises. The daily 200 PKR is credited like clockwork.',
    rating: 4,
  },
  {
    name: 'Sana Javed',
    avatar: 'SJ',
    review: 'The interface is so clean and modern. It feels professional and secure. I appreciate the attention to detail in the design.',
    rating: 5,
  },
  {
    name: 'Ali Hassan',
    avatar: 'AH',
    review: 'Getting my account approved was surprisingly fast. The team is efficient. I started earning the very next day.',
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
              Join ENVO-EARN and start your journey towards financial freedom. Invest 6000 PKR once and earn 200 PKR every single day.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg" asChild>
                <Link href="/invest">Invest 6000 PKR</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-secondary">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="font-headline text-3xl md:text-4xl font-bold text-center">
              Trusted by Investors Across Pakistan
            </h2>
            <p className="mt-2 text-center text-muted-foreground max-w-xl mx-auto">
              Here's what our users have to say about their experience with ENVO-EARN.
            </p>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
