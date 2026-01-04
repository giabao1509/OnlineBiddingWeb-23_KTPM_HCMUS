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
