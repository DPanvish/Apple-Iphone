import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Highlights from './components/Highlights';
import Model from './components/Model';
import * as Sentry from "@sentry/react"

// We are using sentry to track the performance of the site.
// Follow all instructions whilw setting up the sentry sdk
// The sentry setup is in the main.jsx


const App = () => {

  return (
    <main className="bg-black">
      <Navbar/>
      <Hero />
      <Highlights />
      <Model />
    </main>
  )
}

export default Sentry.withProfiler(App);
