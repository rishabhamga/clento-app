import { Waitlist } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            clento
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            AI-powered Sales Development Representative
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"></div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Join the Waitlist
            </h2>
            <p className="text-gray-600">
              Be the first to know when we launch and get early access to our AI SDR platform
            </p>
          </div>
          
          <div className="waitlist-container">
            <Waitlist 
              appearance={{
                elements: {
                  card: "shadow-none border-0 p-0",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  footer: "hidden"
                }
              }}
            />
          </div>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <a href="/sign-in" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
} 