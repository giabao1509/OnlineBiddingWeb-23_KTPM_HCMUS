

export function generateRandomPassword(length) {
    const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-={}[]<>?';

    // đảm bảo có ít nhất 1 ký tự đặc biệt
    let password = specialChars[Math.floor(Math.random() * specialChars.length)];

    const allChars = letters + numbers + specialChars;

    for (let i = 1; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password
        .split('')
        .sort(() => Math.random() - 0.5)
        .join('');
}



export function buildCommentTree(comments) {
    const roots = comments.filter(c => c.parent_id === null);
    roots.forEach(c => {
        c.reply = comments.filter(r => r.parent_id === c.comment_id);
    });



    let commentsTree = roots;

    if (commentsTree.length > 0) {
        commentsTree = commentsTree.map(c => ({
        ...c,
        reply: c.reply.map(r => ({
            ...r 
        }))
        }));
    }
    return commentsTree;
}

export function appendDescriptionWithDate(oldDescription, newContent) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const todayStr = `${day}/${month}/${year}`;
    const todayPrefix = `✏️ ${todayStr}`;

    if (!oldDescription || oldDescription.trim() === '') {
        return `<span class="badge bg-primary">${todayPrefix}</span>\n<p>${newContent}</p>`;
    }

    // Lấy thẻ <span> có badge để check ngày
    const spanMatches = oldDescription.match(/<span[^>]*>(.*?)<\/span>/g) || [];
    const lastSpan = spanMatches.length ? spanMatches[spanMatches.length - 1] : '';

    if (lastSpan.includes(todayStr)) {
        // Append nội dung mới dưới cùng ngày hiện tại
        return oldDescription + `\n<p>${newContent}</p>`;
    } else {
        // Thêm ngày mới
        return oldDescription + `\n<span class="badge bg-primary">${todayPrefix}</span>\n<p>${newContent}</p>`;
    }
}


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




