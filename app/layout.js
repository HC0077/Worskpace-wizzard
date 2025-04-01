import './globals.css';

export const metadata = {
  title: 'Workspace Orchestrator - Screenpipe',
  description: 'Automate your workspace setup with customizable layouts',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
