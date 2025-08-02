import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="container">
      <h1>Blog</h1>
      {posts.length === 0 ? (
        <p>No blog posts yet.</p>
      ) : (
        <ul className="post-list">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`}>
                <h2>{post.title}</h2>
                <time dateTime={post.date}>{new Date(post.date).toLocaleDateString()}</time>
                {post.excerpt && <p>{post.excerpt}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}