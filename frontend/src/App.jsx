import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'

import Hero from './components/sections/Hero'
import News from './components/sections/News'
import Highlights from './components/sections/Highlights'
import About from './components/sections/About'
import Services from './components/sections/Services'
import Projects from './components/sections/Projects'
import Process from './components/sections/Process'
import Impact from './components/sections/Impact'
import Testimonial from './components/sections/Testimonial'
import CallToAction from './components/sections/CallToAction'
import Contact from './components/sections/Contact'

/**
 * Susunan halaman dari atas ke bawah.
 * Ingin memindah / menghapus section? Cukup ubah baris di bawah ini.
 */
export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">Lewati ke konten utama</a>
      <Navbar />

      <main id="main">
        <Hero />
        <News />
        <Highlights />
        <About />
        <Services />
        <Projects />

        <Process />

        {/*<Impact />
        <Testimonial />
        <CallToAction />*/}
        
        <Contact />
      </main>

      <Footer />
    </>
  )
}
