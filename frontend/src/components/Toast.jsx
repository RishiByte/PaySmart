import { useToast } from './ToastContext';

export default function Toast() {
    const { toasts } = useToast();

    return (
        <div className="toast-container">
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast-${t.type}`}>
                    {t.type === 'success' ? '✓' : '✕'} {t.message}
                </div>
            ))}
        </div>
    );
}
