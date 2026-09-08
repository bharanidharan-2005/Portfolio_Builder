import { useState } from 'react';

export default function EditableText({
    value,
    onCommit,
    as: Tag = 'span',
    className = '',
    placeholder,
    multiline = false,
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value || '');

    const beginEdit = () => {
        setDraft(value || '');
        setEditing(true);
    };

    const commit = () => {
        setEditing(false);
        if (draft !== (value || '')) onCommit(draft);
    };

    const cancel = () => {
        setEditing(false);
        setDraft(value || '');
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !multiline) {
            e.preventDefault();
            commit();
        } else if (e.key === 'Escape') {
            cancel();
        }
    };

    // Google-Docs style active edit input
    const editableClass = 'rounded px-1.5 py-0.5 -mx-1.5 outline-none border-2 border-blue-500 bg-white text-slate-900 w-full min-w-[2rem] shadow-sm font-inherit';

    if (editing) {
        if (multiline) {
            return (
                <textarea
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={onKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder={placeholder}
                    rows={2}
                    className={`${editableClass} resize-none leading-relaxed`}
                />
            );
        }
        return (
            <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={onKeyDown}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder={placeholder}
                className={editableClass}
            />
        );
    }

    return (
        <Tag
            className={`${className} inline-block rounded cursor-text transition-colors hover:bg-black/5 hover:ring-2 hover:ring-black/5 hover:outline-none`}
            onDoubleClick={(e) => {
                e.stopPropagation();
                beginEdit();
            }}
            title="Double-click to edit"
        >
            {value || placeholder}
        </Tag>
    );
}