import "@xyflow/react/dist/style.css";
import "./globals.css";

export const metadata = {
  title: "Workflow Canvas",
  description: "Node-based visual workflow editor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
