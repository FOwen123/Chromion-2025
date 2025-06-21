import { Wallet, Link, Clock } from 'lucide-react'

export default function HowItWorks() {
    return (
        <section className="w-full text-white py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-balance text-4xl lg:text-5xl font-bold mb-4">How LinkFi Works</h2>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Accept blockchain payments in minutes with our simple three-step process. No complex integrations required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="border border-zinc-800 rounded-lg p-8 flex flex-col items-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-gray-700"></div>
                ))}
              </div>
              <div className="relative flex items-center justify-center h-24 w-24">
                <Wallet className="h-12 w-12 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4">Connect Wallet</h3>
            <p className="text-gray-400 text-center">
              Login or create a wallet to link payments directly to your blockchain address. Full control of your funds.
            </p>
            <div className="mt-auto pt-6 flex items-center justify-center">
              <span className="bg-zinc-800 text-white text-sm font-medium rounded-full h-8 w-8 flex items-center justify-center">1</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="border border-zinc-800 rounded-lg p-8 flex flex-col items-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-gray-700"></div>
                ))}
              </div>
              <div className="relative flex items-center justify-center h-24 w-24">
                <Link className="h-12 w-12 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4">Create Payment Link</h3>
            <p className="text-gray-400 text-center">
              Generate a unique payment link that can be shared with anyone.
            </p>
            <div className="mt-auto pt-6 flex items-center justify-center">
              <span className="bg-zinc-800 text-white text-sm font-medium rounded-full h-8 w-8 flex items-center justify-center">2</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="border border-zinc-800 rounded-lg p-8 flex flex-col items-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-gray-700"></div>
                ))}
              </div>
              <div className="relative flex items-center justify-center h-24 w-24">
                <Clock className="h-12 w-12 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4">Receive Payments</h3>
            <p className="text-gray-400 text-center">
              Get notified instantly when payments arrive in your wallet.
            </p>
            <div className="mt-auto pt-6 flex items-center justify-center">
              <span className="bg-zinc-800 text-white text-sm font-medium rounded-full h-8 w-8 flex items-center justify-center">3</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}