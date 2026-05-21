import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { QueryProvider } from '../shared/query/QueryProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'LiveClass Weekly Study Planner',
  description: '학습 플래너 채용 과제 프로젝트',
};

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="ko">
    <body>
      <QueryProvider>{children}</QueryProvider>
    </body>
  </html>
);

export default RootLayout;
