
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
    