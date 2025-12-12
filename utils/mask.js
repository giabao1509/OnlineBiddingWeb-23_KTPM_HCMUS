export function maskName(name) {
    if (!name) return "Ẩn danh";

    name = name.trim();
    if (name.length === 0) return "Ẩn danh";

    // Tách từ
    const parts = name.split(/\s+/);
    const lastName = parts[parts.length - 1];

    // Tổng số ký tự của phần bị che (tức toàn bộ trừ tên cuối)
    const maskedLength = name.length - lastName.length;

    // Tạo chuỗi mask
    const mask = "*".repeat(Math.max(1, maskedLength));

    return mask + lastName;
}
