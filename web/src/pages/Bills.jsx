import { ActionIcon, Badge, Button, Card, Group, SimpleGrid, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconCheck, IconReceipt, IconRepeat, IconTrash } from "@tabler/icons-react";
import dayjs from "dayjs";
import { api, brl, daysUntil, fmtDate, useResource } from "../api.js";
import { AddButton, EmptyState, LoadingList, PageHeader, confirmDelete } from "../components/ui.jsx";

const EMOJI = { Casa: "🏠", Luz: "💡", Água: "💧", Internet: "📶", Gás: "🔥", Cartão: "💳", Escola: "🎒", Saúde: "🩺", Transporte: "🚗", Outros: "🧾" };

function status(b) {
  if (b.paid) return { label: "paga", color: "teal" };
  const d = daysUntil(b.due_date);
  if (d < 0) return { label: `vencida há ${-d}d`, color: "red" };
  if (d === 0) return { label: "vence hoje", color: "orange" };
  if (d <= 7) return { label: `em ${d} dias`, color: "yellow" };
  return { label: fmtDate(b.due_date), color: "gray" };
}

export default function Bills() {
  const { rows, loading, create, remove, run } = useResource("bills");
  const open = rows.filter((b) => !b.paid);
  const paid = rows.filter((b) => b.paid).slice(-6).reverse();
  const totalOpen = open.reduce((s, b) => s + b.amount, 0);
  const pay = run((id) => api.action(`/bills/${id}/pay`), "Conta paga e lançada nas finanças ✅");

  const BillCard = ({ b }) => {
    const st = status(b);
    return (
      <Card p="md" className={`lift ${b.paid ? "done" : ""}`}>
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon size={44} radius="lg" variant="light" color={st.color}><Text fz={22}>{EMOJI[b.category] || "🧾"}</Text></ThemeIcon>
            <div>
              <Group gap={6}>
                <Text fw={700}>{b.name}</Text>
                {b.recurring && <IconRepeat size={14} color="var(--mantine-color-dimmed)" />}
              </Group>
              <Text fz="xl" fw={800} lh={1.2}>{brl(b.amount)}</Text>
              <Text size="xs" c="dimmed">vence {dayjs(b.due_date).format("DD/MM/YYYY")}</Text>
            </div>
          </Group>
          <ActionIcon variant="subtle" color="gray" onClick={() => confirmDelete(b.name, () => remove(b.id))}><IconTrash size={16} /></ActionIcon>
        </Group>
        <Group justify="space-between" mt="md">
          <Badge color={st.color} variant="light" size="lg">{st.label}</Badge>
          {!b.paid && <Button size="xs" color="teal" leftSection={<IconCheck size={14} />} onClick={() => pay(b.id)}>Paguei</Button>}
        </Group>
      </Card>
    );
  };

  return (
    <>
      <PageHeader
        icon={IconReceipt}
        color="red"
        title="Contas"
        subtitle={open.length ? `${open.length} em aberto · ${brl(totalOpen)}` : "Nenhuma conta em aberto"}
        action={
          <AddButton
            title="Nova conta"
            color="red"
            onSubmit={create}
            fields={[
              { name: "name", label: "Conta", required: true, placeholder: "Ex.: Energia" },
              { name: "amount", label: "Valor", type: "number", required: true, prefix: "R$ " },
              { name: "due_date", label: "Vencimento", type: "date", required: true },
              { name: "category", label: "Categoria", type: "select", default: "Casa", data: Object.keys(EMOJI) },
              { name: "recurring", label: "Repete todo mês", type: "switch" },
            ]}
          />
        }
      />

      {loading ? <LoadingList n={4} h={130} /> : rows.length === 0 ? (
        <EmptyState emoji="🧾" title="Nenhuma conta" text="Cadastre luz, água, internet… e marque como mensal para criar a próxima sozinha." />
      ) : (
        <Stack gap="lg">
          {open.length > 0 && (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              {open.sort((a, b) => a.due_date.localeCompare(b.due_date)).map((b) => <BillCard key={b.id} b={b} />)}
            </SimpleGrid>
          )}
          {paid.length > 0 && (
            <>
              <Text fw={700} c="dimmed" size="xs" tt="uppercase">Pagas recentemente</Text>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                {paid.map((b) => <BillCard key={b.id} b={b} />)}
              </SimpleGrid>
            </>
          )}
        </Stack>
      )}
    </>
  );
}
