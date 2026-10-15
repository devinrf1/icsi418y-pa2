export default function ProjectList({ projects }) {
  return (
    <section>
      <h2>Project list</h2>
      {projects.length === 0 && <p>No projects have been created.</p>}
      {projects.map((project) => (
        <article key={project._id}>
          <h3>{project.name}</h3>
          <p>{project.description}</p>
          <p>Status: {project.status}</p>
          <p>Project Lead: {project.project_lead_username}</p>
        </article>
      ))}
    </section>
  );
}
