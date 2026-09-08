import { useRef, useState } from 'react';

// Versioned backup schema so future migrations can detect and upgrade old files.
const SCHEMA_VERSION = 1;

function isValidBackupData(data) {
    return !!(
        data &&
        typeof data === 'object' &&
        Array.isArray(data.pages) &&
        data.userData &&
        typeof data.userData === 'object'
    );
}

// Download a timestamped, versioned backup of the workspace state. Pure Web
// APIs (Blob + anchor) — no heavy dependencies, and no layout shift since the
// download happens through the browser's native save flow.
export default function useDataPortability({ pages, userData, onRestore }) {
    const fileInputRef = useRef(null);
    const [importing, setImporting] = useState(false);

    const exportStateToJson = () => {
        const payload = {
            schemaVersion: SCHEMA_VERSION,
            exportedAt: new Date().toISOString(),
            data: {
                pages,
                userData,
            },
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'portfolio-backup.json';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        return payload;
    };

    const importStateFromJson = (file) => {
        if (!file) return Promise.reject(new Error('No file selected.'));
        setImporting(true);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const parsed = JSON.parse(String(reader.result));
                    if (parsed.schemaVersion !== SCHEMA_VERSION) {
                        reject(new Error(`Unsupported backup version (expected v${SCHEMA_VERSION}).`));
                        return;
                    }
                    if (!isValidBackupData(parsed.data)) {
                        reject(new Error('Invalid backup file: missing pages or userData.'));
                        return;
                    }
                    if (onRestore) onRestore(parsed.data);
                    resolve(parsed.data);
                } catch {
                    reject(new Error('Corrupt JSON — could not read the backup file.'));
                } finally {
                    setImporting(false);
                }
            };
            reader.onerror = () => {
                setImporting(false);
                reject(new Error('Could not read the selected file.'));
            };
            reader.readAsText(file);
        });
    };

    const triggerFileInput = () => fileInputRef.current?.click();

    return { exportStateToJson, importStateFromJson, triggerFileInput, fileInputRef, importing };
}