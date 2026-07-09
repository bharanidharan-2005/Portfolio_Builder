import React from 'react';

export default function PipelineBar({ currentStep }) {
    // These match the exact states in your App.jsx state machine
    const steps = ['NAME', 'CREDENTIALS', 'PREFERENCES', 'CONCEPT', 'WORKSPACE'];

    // Find where the user is currently at
    const activeIndex = steps.indexOf(currentStep);

    return ( <
        div className = "h-10 border-b border-[#1f222c] bg-[#0d0e12] flex items-center justify-center gap-2 px-6 shrink-0 select-none" > {
            steps.map((step, index) => ( <
                React.Fragment key = { step } >
                <
                div className = { `text-[9px] font-bold px-3 py-1 rounded-full transition-all border 
                        ${index <= activeIndex 
                            ? 'bg-purple-600/20 border-purple-500/50 text-purple-400' 
                            : 'bg-[#13151c] border-[#1f222c] text-slate-600'}` } > [{ step }] <
                /div> {
                    index < steps.length - 1 && ( <
                        span className = "text-slate-700 text-[10px]" > → < /span>
                    )
                } <
                /React.Fragment>
            ))
        } <
        /div>
    );
}