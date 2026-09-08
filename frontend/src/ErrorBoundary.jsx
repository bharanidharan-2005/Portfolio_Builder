import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('AuraBuild crashed:', error, info);
    }

    render() {
        if (this.state.error) {
            return (
                <div className="min-h-screen w-screen flex items-center justify-center bg-[#090a0f] text-slate-200 p-6">
                    <div className="max-w-lg w-full bg-[#13151c] border border-red-500/30 rounded-2xl p-8 shadow-2xl">
                        <h1 className="text-lg font-bold text-red-400 mb-3">
                            Something went wrong.
                        </h1>
                        <p className="text-xs text-slate-400 mb-4">
                            The app hit an unexpected error. The details are shown below
                            and in the browser console. Try reloading the page.
                        </p>
                        <pre className="text-[11px] text-slate-300 bg-[#0d0e12] border border-[#1f222c] rounded-xl p-4 overflow-auto whitespace-pre-wrap">
                            {String(this.state.error && this.state.error.stack ? this.state.error.stack : this.state.error)}
                        </pre>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-5 w-full bg-[#a855f7] text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest"
                        >
                            Reload
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
