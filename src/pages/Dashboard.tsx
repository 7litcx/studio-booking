import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, CreditCard, Heart, Bell, User, Clock, ArrowUpRight } from 'lucide-react'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('bookings')

  const UPCOMING_BOOKINGS = [
    { id: 1, studio: "The Velvet Room", date: "July 12, 2026", time: "14:00 - 18:00", status: "Confirmed", cost: 600 },
    { id: 2, studio: "Lumière Stage A", date: "July 28, 2026", time: "09:00 - 17:00", status: "Pending Setup", cost: 2000 }
  ]

  const PAST_BOOKINGS = [
    { id: 3, studio: "Echo Podcast Suite", date: "June 15, 2026", time: "10:00 - 12:00", status: "Completed", cost: 170 }
  ]

  return (
    <div className="pt-28 pb-32 min-h-screen bg-background">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <div className="w-full lg:w-64 space-y-2">
            {[
              { id: 'bookings', label: 'My Bookings', icon: Calendar },
              { id: 'payments', label: 'Payments & Invoices', icon: CreditCard },
              { id: 'favorites', label: 'Saved Studios', icon: Heart },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'profile', label: 'Profile Settings', icon: User }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl text-left font-medium transition-all cursor-pointer ${
                    activeTab === tab.id 
                      ? 'bg-primary text-white shadow-[0_0_30px_rgba(177,18,38,0.2)]' 
                      : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Main Area */}
          <div className="flex-grow space-y-8">
            {activeTab === 'bookings' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-cinematic font-bold">Upcoming Bookings</h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {UPCOMING_BOOKINGS.map((booking) => (
                    <div key={booking.id} className="glass-card p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-2 h-full bg-primary" />
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-semibold">
                            {booking.status}
                          </span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            Session Scheduled
                          </span>
                        </div>
                        <h3 className="text-2xl font-cinematic font-bold">{booking.studio}</h3>
                        <div className="flex gap-6 text-sm text-muted-foreground">
                          <div>
                            <span className="block text-xs uppercase tracking-wider mb-1">Date</span>
                            <span className="text-foreground font-medium">{booking.date}</span>
                          </div>
                          <div>
                            <span className="block text-xs uppercase tracking-wider mb-1">Time</span>
                            <span className="text-foreground font-medium">{booking.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Estimated Fee</span>
                        <span className="text-3xl font-cinematic font-bold text-foreground">${booking.cost}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-2xl font-cinematic font-bold mb-6">Past Sessions</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {PAST_BOOKINGS.map((booking) => (
                      <div key={booking.id} className="glass p-6 rounded-2xl flex justify-between items-center text-sm">
                        <div>
                          <h4 className="font-bold text-foreground mb-1">{booking.studio}</h4>
                          <p className="text-muted-foreground">{booking.date} at {booking.time}</p>
                        </div>
                        <span className="text-foreground font-bold">${booking.cost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'payments' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <h2 className="text-3xl font-cinematic font-bold">Payments & Receipts</h2>
                <div className="glass-card p-6 rounded-2xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="pb-4">Invoice ID</th>
                        <th className="pb-4">Date</th>
                        <th className="pb-4">Amount</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-border">
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="py-4 font-mono">INV-2026-003</td>
                        <td className="py-4">June 15, 2026</td>
                        <td className="py-4 text-foreground font-semibold">$170.00</td>
                        <td className="py-4"><span className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded text-xs font-medium">Paid</span></td>
                        <td className="py-4 text-right"><button className="text-primary hover:underline inline-flex items-center gap-1">PDF <ArrowUpRight className="w-4 h-4" /></button></td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="py-4 font-mono">INV-2026-002</td>
                        <td className="py-4">May 10, 2026</td>
                        <td className="py-4 text-foreground font-semibold">$350.00</td>
                        <td className="py-4"><span className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded text-xs font-medium">Paid</span></td>
                        <td className="py-4 text-right"><button className="text-primary hover:underline inline-flex items-center gap-1">PDF <ArrowUpRight className="w-4 h-4" /></button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'favorites' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-cinematic font-bold">Saved Spaces</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass p-6 rounded-2xl flex gap-4 items-center">
                    <img src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=256" alt="" className="w-20 h-20 object-cover rounded-xl" />
                    <div>
                      <h3 className="font-bold">The Velvet Room</h3>
                      <p className="text-sm text-muted-foreground">Photography • Los Angeles</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-cinematic font-bold">Notifications</h2>
                <div className="space-y-4">
                  <div className="glass p-5 rounded-2xl flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-foreground">Booking Confirmation</h4>
                      <p className="text-sm text-muted-foreground mt-1">Your session at "The Velvet Room" has been successfully confirmed.</p>
                    </div>
                    <span className="text-xs text-muted-foreground">2 hours ago</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-cinematic font-bold">Profile Settings</h2>
                <div className="glass-card p-8 rounded-3xl space-y-6 max-w-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold">
                      ER
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Elena Rodriguez</h3>
                      <p className="text-sm text-muted-foreground">elena.rodriguez@vogue.com</p>
                    </div>
                  </div>
                  <div className="border-t border-border pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-xs text-muted-foreground mb-1">First Name</span>
                        <span className="text-sm text-foreground font-medium">Elena</span>
                      </div>
                      <div>
                        <span className="block text-xs text-muted-foreground mb-1">Last Name</span>
                        <span className="text-sm text-foreground font-medium">Rodriguez</span>
                      </div>
                    </div>
                    <div>
                      <span className="block text-xs text-muted-foreground mb-1">Company</span>
                      <span className="text-sm text-foreground font-medium">Vogue Magazine</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
