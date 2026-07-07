import Hero from '../sections/Hero'
import FeaturedStudios from '../sections/FeaturedStudios'
import Categories from '../sections/Categories'
import WhyChooseUs from '../sections/WhyChooseUs'
import Testimonials from '../sections/Testimonials'
import HowItWorks from '../sections/HowItWorks'
import Equipment from '../sections/Equipment'
import Pricing from '../sections/Pricing'
import Faq from '../sections/Faq'

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      <Hero />
      <HowItWorks />
      <FeaturedStudios />
      <Categories />
      <Equipment />
      <WhyChooseUs />
      <Pricing />
      <Testimonials />
      <Faq />
    </div>
  )
}
