export function displayTimeRemaining(dateTime) {
      /* ========= TIME REMAINING ========= */
    const now = new Date();
    const end = new Date(dateTime);

    const diffMs = end - now;

    if (diffMs <= 0) {
        return "Ended";
    } else {
        const diffSec = Math.floor(diffMs / 1000);
        const days = Math.floor(diffSec / (24 * 3600));
        const hours = Math.floor((diffSec % (24 * 3600)) / 3600);
        const minutes = Math.floor((diffSec % 3600) / 60);
        const seconds = diffSec % 60;

        // If less than 3 days → show relative time
        if (days < 3) {
            if (days > 0) {
                return `${days} day${days > 1 ? 's' : ''} left`;
            } else if (hours > 0) {
                return `${hours} hour${hours > 1 ? 's' : ''} left`;
            } else if (minutes > 0) {
                return `${minutes} minute${minutes > 1 ? 's' : ''} left`;
            } else {
                return `${seconds} second${seconds > 1 ? 's' : ''} left`;
            }
        } else {
            // Show full countdown if >= 3 days
            return `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }
    }
}

