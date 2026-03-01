import { useToast } from './ToastContext';
import { CheckCircle, XCircle } from 'lucide-react';

export default function Toast() {
    const { toasts } = useToast();

    return (
        <div className="toast-container">
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast-${t.type}`}>
                    {t.type === 'success' ? <CheckCircle /> : <XCircle />}
                    {t.message}
                </div>
            ))}
        </div>
    );
}
