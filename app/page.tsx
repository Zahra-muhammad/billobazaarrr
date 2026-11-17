import Landing from '@/components/Landing';
import Intro from '@/components/Intro';
import HowItWorks from '@/components/HowItWorks';

export default function Home() {
  return (
    <>
      {/* wrapped, so pinning the landing (see Intro) never moves a node React itself removes */}
      <div className="landing-wrap">
        <Landing />
      </div>
      <Intro />
      <HowItWorks />
    </>
  );
}
