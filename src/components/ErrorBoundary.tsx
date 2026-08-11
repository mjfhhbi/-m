import React, { ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare props: Props;
  declare state: State;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center dir-rtl font-['Vazirmatn',sans-serif]">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400 text-2xl font-bold">
            !
          </div>
          <h1 className="text-xl font-bold text-zinc-100 mb-2">خطایی در اجرای برنامه‌ رخ داده است</h1>
          <p className="text-sm text-zinc-400 mb-6 max-w-sm">
            لطفاً صفحه را دوباره بازخوانی کنید یا مرورگر خود را به‌روزرسانی نمایید.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium rounded-xl text-sm transition-colors shadow-lg shadow-amber-500/20"
          >
            تلاش مجدد / بارگذاری مجدد
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
