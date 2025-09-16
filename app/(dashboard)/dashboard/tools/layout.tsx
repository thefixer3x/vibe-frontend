'use client';

import { ReactNode } from 'react';
import DashboardLayout from '../layout';

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}