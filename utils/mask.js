export function maskName(name) {
    if (!name) return "Anonymous";

    name = name.trim();
    if (!name) return "Anonymous";

    // bỏ khoảng trắng
    const clean = name.replace(/\s+/g, "");

    const chars = Array.from(clean);

    const result = [];
    for (let i = 0; i < chars.length; i += 2) {
        result.push(chars[i]);
    }

    return result.join("*");
}
