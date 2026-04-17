import {Source_Serif_4, Source_Sans_3} from 'next/font/google';

export const fontSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext', 'greek'],
  variable: '--font-serif',
  display: 'swap',
  axes: ['opsz'],
});

export const fontSans = Source_Sans_3({
  subsets: ['latin', 'latin-ext', 'greek'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '600', '700'],
});
