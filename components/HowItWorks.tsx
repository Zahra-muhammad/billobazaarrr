import fs from 'node:fs';
import path from 'node:path';
import { site } from '@/data/site';
import HowItWorksStepper from './HowItWorksStepper';

/**
 * "How it works". Checks which step photos exist in /public/img, so a missing photo shows a
 * labelled placeholder card instead of a broken image (drop the file in and it appears).
 */
export default function HowItWorks() {
  const have = site.how.steps.map((s) => fs.existsSync(path.join(process.cwd(), 'public', s.photo.src)));
  return <HowItWorksStepper have={have} />;
}
