export function appendDescriptionWithDate(oldDescription, newContent) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    // Thêm class Bootstrap cho ngày để nổi bật
    const todayPrefix = `✏️ ${day}/${month}/${year}`;

    if (!oldDescription || oldDescription.trim() === '') {
        // Nếu chưa có mô tả cũ, tạo mới
        return `<span class="badge bg-primary">${todayPrefix}</span>\n<p>${newContent}</p>`;
    }

    // Tách các <p> ra để kiểm tra ngày cuối cùng
    const pMatches = oldDescription.match(/<p>.*?<\/p>/g) || [];
    const lastP = pMatches.length ? pMatches[pMatches.length - 1] : '';

    // Kiểm tra ngày cuối cùng có trùng ngày hôm nay không
    if (lastP.includes(day + '/' + month + '/' + year)) {
        // Append nội dung mới **dưới cùng ngày hiện tại**
        return oldDescription + `\n<p>${newContent}</p>`;
    } else {
        // Thêm ngày mới
        return oldDescription + `\n<p>${todayPrefix}</p>\n<p>${newContent}</p>`;
    }
}
