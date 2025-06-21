import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Link, Wallet, Shield } from 'lucide-react'
import { type ReactNode } from 'react'

export function Features() {
    return (
        <section id="features" className="bg-zinc-50 py-16 md:py-32 dark:bg-transparent">
            <div className="@container mx-auto max-w-5xl px-6">
                <div className="text-center">
                    <h2 className="text-balance text-4xl font-semibold lg:text-5xl">Why Choose LinkFi</h2>
                    <p className="mt-4 text-gray-400">The simplest way to accept blockchain payments with instant notifications and full control.</p>
                </div>
                <div className="@min-4xl:max-w-full @min-4xl:grid-cols-3 mx-auto mt-8 grid max-w-sm gap-6 *:text-center md:mt-16">
                    <Card className="group shadow-black-950/5">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Link className="size-6" aria-hidden />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium">Easy Payment Links</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm">Create and customize payment links with your preferred cryptocurrency, amount, and payment details to suit your business needs.</p>
                        </CardContent>
                    </Card>

                    <Card className="group shadow-black-950/5">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Wallet className="size-6" aria-hidden />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium">Full Wallet Control</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm">Manage your payment links, track transactions, and withdraw funds directly to your wallet whenever you want.</p>
                        </CardContent>
                    </Card>

                    <Card className="group shadow-black-950/5">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Shield className="size-6" aria-hidden />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium">Secure & Smart</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm">Smart payment detection and instant notifications ensure you never miss a transaction, with AI-powered security to protect your funds.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
    <div aria-hidden className="relative mx-auto size-36 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]">
        <div className="absolute inset-0 [--border:black] dark:[--border:white] bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-10"/>
        <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-t border-l">{children}</div>
    </div>
)