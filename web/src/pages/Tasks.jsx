import { useState } from "react";
import { ActionIcon, Badge, Card, Checkbox, Group, SegmentedControl, Stack, Text } from "@mantine/core";
import { IconCalendar, IconChecklist, IconTrash } from "@tabler/icons-react";
import { daysUntil, fmtDate, useResource } from "../api.js";
import { AddButton, EmptyState, LoadingList, PageHeader, confirmDelete } from "../components/ui.jsx";

const PRIORITY = {
  high: { label: "Alta", color: "red" },
  medium: { label: "Média", color: "yellow" },
  low: { label: "Baixa", color: "gray" },
};
const order = { high: 0, medium: 1, low: 2 };

function dueBadge(d) {
  if (!d) return null;
  const n = daysUntil(d);
  const color = n < 0 ? "red" : n <= 1 ? "orange" : "gray";
  const text = n < 0 ? `atrasada ${-n}d` : n === 0 ? "hoje" : n === 1 ? "amanhã" : fmtDate(d);
  return <Badge leftSection={<IconCalendar size={12} />} color={color} variant="light">{text}</Badge>;
}

export default function Tasks() {
  const { rows, loading, create, patch, remove } = useResource("tasks");
  const [filter, setFilter] = useState("open");

  const list = rows
    .filter((r) => (filter === "open" ? !r.done : filter === "done" ? r.done : true))
    .sort((a, b) => a.done - b.done || order[a.priority] - order[b.priority] || (a.due_date || "9").localeCompare(b.due_date || "9"));

  return (
    <>
      <PageHeader
        icon={IconChecklist}
        color="violet"
        title="Tarefas"
        subtitle={`${rows.filter((r) => !r.done).length} pendentes`}
        action={
          <AddButton
            title="Nova tarefa"
            color="violet"
            onSubmit={create}
            fields={[
              { name: "title", label: "O que precisa ser feito?", required: true, placeholder: "Ex.: Trocar lâmpada da cozinha" },
              { name: "due_date", label: "Prazo", type: "date" },
              { name: "priority", label: "Prioridade", type: "select", default: "medium", data: Object.entries(PRIORITY).map(([value, p]) => ({ value, label: p.label })) },
              { name: "notes", label: "Observações" },
            ]}
          />
        }
      />

      <SegmentedControl
        fullWidth
        radius="xl"
        mb="lg"
        color="violet"
        value={filter}
        onChange={setFilter}
        data={[{ value: "open", label: "Pendentes" }, { value: "done", label: "Feitas" }, { value: "all", label: "Todas" }]}
      />

      {loading ? <LoadingList /> : list.length === 0 ? (
        <EmptyState emoji={filter === "open" ? "🎉" : "📝"} title={filter === "open" ? "Nada pendente!" : "Nenhuma tarefa"} text="Toque em + para criar uma tarefa." />
      ) : (
        <Stack gap="sm">
          {list.map((r) => (
            <Card key={r.id} p="md" className={`lift ${r.done ? "done" : ""}`} style={{ borderLeft: `4px solid var(--mantine-color-${PRIORITY[r.priority].color}-6)` }}>
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <Group wrap="nowrap" align="flex-start" gap="sm">
                  <Checkbox size="md" radius="xl" color="violet" checked={r.done} onChange={(e) => patch(r.id, { done: e.currentTarget.checked })} mt={2} />
                  <div>
                    <Text fw={700} className="strike">{r.title}</Text>
                    {r.notes && <Text size="sm" c="dimmed">{r.notes}</Text>}
                    <Group gap={6} mt={6}>
                      <Badge color={PRIORITY[r.priority].color} variant="dot">{PRIORITY[r.priority].label}</Badge>
                      {!r.done && dueBadge(r.due_date)}
                    </Group>
                  </div>
                </Group>
                <ActionIcon variant="subtle" color="gray" onClick={() => confirmDelete(r.title, () => remove(r.id))}><IconTrash size={16} /></ActionIcon>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </>
  );
}
