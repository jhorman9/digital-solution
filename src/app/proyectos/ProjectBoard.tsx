"use client";

import Link from "next/link";
import { useState, type DragEvent } from "react";
import { updateProjectStatus } from "../actions";
import { date, phaseLabels, statusLabels } from "@/lib/labels";

type P = {
  id: string;
  name: string;
  status: keyof typeof statusLabels;
  priority: string;
  dueDate: Date;
  client: { name: string };
  phase: keyof typeof phaseLabels;
};

export default function ProjectBoard({ projects }: { projects: P[] }) {
  const columns = Object.keys(statusLabels) as P["status"][];
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<P["status"] | null>(null);

  const handleDragStart = (
    event: DragEvent<HTMLElement>,
    projectId: string,
  ) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("project", projectId);
    setDraggingId(projectId);
  };

  const handleDrop = async (
    event: DragEvent<HTMLElement>,
    status: P["status"],
  ) => {
    event.preventDefault();
    const projectId = event.dataTransfer.getData("project");
    setOverStatus(null);
    setDraggingId(null);

    if (projectId) await updateProjectStatus(projectId, status);
  };

  return (
    <div className="kanban">
      {columns.map((status) => {
        const columnProjects = projects.filter(
          (project) => project.status === status,
        );

        return (
          <section
            className={`column ${overStatus === status ? "column-drop-active" : ""}`}
            key={status}
            onDragEnter={() => setOverStatus(status)}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setOverStatus(status);
            }}
            onDragLeave={(event) => {
              if (
                !event.currentTarget.contains(
                  event.relatedTarget as Node | null,
                )
              )
                setOverStatus(null);
            }}
            onDrop={(event) => handleDrop(event, status)}
          >
            <div className="column-head">
              <span>{statusLabels[status]}</span>
              <span className="pill">{columnProjects.length}</span>
            </div>

            {columnProjects.map((project) => (
              <article
                className={`project-card ${draggingId === project.id ? "project-card-dragging" : ""}`}
                key={project.id}
                draggable
                aria-grabbed={draggingId === project.id}
                onDragStart={(event) => handleDragStart(event, project.id)}
                onDragEnd={() => {
                  setDraggingId(null);
                  setOverStatus(null);
                }}
              >
                <div
                  className="drag-handle"
                  title="Arrastra este proyecto a otra columna"
                  aria-label="Arrastrar proyecto"
                >
                  ⠿
                </div>
                <Link href={`/proyectos/${project.id}`}>
                  <h3>{project.name}</h3>
                </Link>
                <p>{project.client.name}</p>
                <div className="card-foot">
                  <span>{phaseLabels[project.phase]}</span>
                  <span>{date(project.dueDate)}</span>
                </div>
                <select
                  aria-label={`Estado de ${project.name}`}
                  value={project.status}
                  onChange={(event) =>
                    updateProjectStatus(
                      project.id,
                      event.target.value as P["status"],
                    )
                  }
                >
                  <option value="NOT_STARTED">Por iniciar</option>
                  <option value="IN_PROGRESS">En progreso</option>
                  <option value="IN_REVIEW">En revisión</option>
                  <option value="COMPLETED">Completado</option>
                </select>
              </article>
            ))}
          </section>
        );
      })}
    </div>
  );
}
