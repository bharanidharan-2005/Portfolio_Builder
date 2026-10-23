import { useState, useEffect, useRef } from 'react';

export default function EditableText({
    value,
    onCommit,
    as: Tag = 'span',
    className = '',
    placeholder = 'Type here...',
    multiline = false,
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value ?? '');
    const inputRef = useRef(null);
    const draftRef = useRef(draft);
    draftRef.current = draft;
    const valueRef = useRef(value);
    valueRef.current = value;
    const lastCommittedRef = useRef(value ?? '');
    const debounceTimerRef = useRef(null);
    const lastTapTime = useRef(0);

    // Keep draft synchronized when prop value changes from outside (only if not currently editing)
    useEffect(() => {
        valueRef.current = value;
        if (!editing) {
            setDraft(value ?? '');
            lastCommittedRef.current = value ?? '';
        }
    }, [value, editing]);

    const beginEdit = () => {
        setDraft(value ?? '');
        lastCommittedRef.current = value ?? '';
        setEditing(true);
    };

    const commitAndClose = (textToSave) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
        setEditing(false);
        const finalVal = textToSave !== undefined ? textToSave : draftRef.current;
        if (finalVal !== lastCommittedRef.current) {
            lastCommittedRef.current = finalVal;
            onCommit(finalVal);
        }
    };

    // Auto-commit on unmount if user navigated away while still editing
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (draftRef.current !== lastCommittedRef.current) {
                onCommit(draftRef.current);
            }
        };
    }, [onCommit]);

    const triggerDebouncedAutosave = (newVal) => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            if (newVal !== lastCommittedRef.current) {
                lastCommittedRef.current = newVal;
                onCommit(newVal);
            }
        }, 700);
    };

    const handleBlur = () => {
        commitAndClose(draftRef.current);
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (!multiline) {
                e.preventDefault();
                commitAndClose(draftRef.current);
            } else if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                commitAndClose(draftRef.current);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            commitAndClose(draftRef.current);
        }
    };

    // Auto-focus and auto-expand height when edit mode opens
    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            if (multiline) {
                inputRef.current.style.height = 'auto';
                inputRef.current.style.height = `${Math.max(inputRef.current.scrollHeight, 40)}px`;
            }
        }
    }, [editing, multiline]);

    const handleTextareaInput = (e) => {
        const val = e.target.value;
        setDraft(val);
        triggerDebouncedAutosave(val);
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.max(e.target.scrollHeight, 40)}px`;
    };

    const handleTouchEnd = (e) => {
        const now = Date.now();
        if (now - lastTapTime.current < 300) {
            // Quick double tap on mobile
            e.preventDefault();
            beginEdit();
        }
        lastTapTime.current = now;
    };

    if (editing) {
        return (
            <span 
                className="relative inline-block w-full max-w-full my-0.5 z-30 text-left"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
            >
                {multiline ? (
                    <textarea
                        ref={inputRef}
                        value={draft}
                        onChange={handleTextareaInput}
                        onBlur={handleBlur}
                        onKeyDown={onKeyDown}
                        placeholder={placeholder}
                        rows={2}
                        className="w-full max-w-full rounded-lg px-2.5 py-1.5 outline-none border-2 border-[#7c00ff] bg-slate-900/95 text-white font-inherit text-inherit leading-relaxed shadow-[0_0_15px_rgba(124,0,255,0.3)] ring-2 ring-[#7c00ff]/20 resize-y min-h-[50px] max-h-[300px] block"
                    />
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        value={draft}
                        onChange={(e) => {
                            const val = e.target.value;
                            setDraft(val);
                            triggerDebouncedAutosave(val);
                        }}
                        onBlur={handleBlur}
                        onKeyDown={onKeyDown}
                        placeholder={placeholder}
                        className="w-full max-w-full rounded-lg px-2 py-1 outline-none border-2 border-[#7c00ff] bg-slate-900/95 text-white font-inherit text-inherit leading-relaxed shadow-[0_0_15px_rgba(124,0,255,0.3)] ring-2 ring-[#7c00ff]/20 block"
                    />
                )}
            </span>
        );
    }

    return (
        <Tag
            className={`group/editable relative rounded-md transition-all cursor-pointer inline-block max-w-full hover:ring-1 hover:ring-[#7c00ff]/50 hover:bg-[#7c00ff]/10 px-1 -mx-1 ${className} ${
                !value ? 'opacity-60 italic' : ''
            }`}
            onDoubleClick={(e) => {
                e.stopPropagation();
                beginEdit();
            }}
            onTouchEnd={handleTouchEnd}
            title="Double-click to edit"
        >
            <span className={multiline ? "break-words" : ""}>
                {value || placeholder}
            </span>
        </Tag>
    );
}