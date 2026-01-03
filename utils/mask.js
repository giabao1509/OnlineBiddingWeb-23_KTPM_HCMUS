export function maskName(name, maskLength = 5) {
    if (!name) return "Anonymous";

    name = name.trim();
    if (name.length === 0) return "Anonymous";

    // Split name into words
    const parts = name.split(/\s+/);
    const lastName = parts[parts.length - 1];

    // Create fixed-length mask
    const mask = "*".repeat(Math.max(1, maskLength));

    return mask + lastName;
}