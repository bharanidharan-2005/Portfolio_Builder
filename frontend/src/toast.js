// Global toast bus — any component can fire a toast without prop drilling.
// App.jsx listens for the 'aurabuild-toast' CustomEvent and renders the stack.
export function notify(message, type = 'info', options = {}) {
    window.dispatchEvent(new CustomEvent('aurabuild-toast', { detail: { message, type, ...options } }));
}
