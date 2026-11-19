import { useMemo } from "react";
import { useMediaQuery } from "@mantine/hooks";
import { ActionIcon, Card, Group, SimpleGrid, Stack, Text, ThemeIcon } from "@mantine/core";
import { BarChart } from "@mantine/charts";
import { IconArrowDownRight, IconArrowUpRight, IconTrash, IconWallet } from "@tabler/icons-react";
import dayjs from "dayjs";
import { brl, today, useResource } from "../api.js";
import { AddButton, EmptyState, LoadingList, PageHeader, confirmDelete } from "../components/ui.jsx";

const CATEGORIES = ["Mercado", "Casa", "Contas", "Transporte", "Saúde", "Lazer", "Educação", "Salário", "Extra", "Outros"];

export default function Finance() {
  const { rows, loading, create, remove } = useResource("transactions");
  const mobile = useMediaQuery("(max-width: 48em)");

  // últimos 6 meses: entradas x saídas
  const chart = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => dayjs().subtract(5 - i, "month"));
    return months.map((m) => {
      const inMonth = rows.filter((t) => dayjs(t.date).isSame(m, "month"));
      const sum = (k) => inMonth.filter((t) => t.kind === k).reduce((s, t) => s + t.amount, 0);
      return { mes: m.format("MMM"), Entradas: sum("income"), Saídas: sum("expense") };
    });
  }, [rows]);

  const month = chart.at(-1) || { Entradas: 0, Saídas: 0 };

  // agrupa o extrato por dia
  const byDay = rows.reduce((acc, t) => ((acc[t.date] ||= []).push(t), acc), {});

  return (
    <>
      <PageHeader
        icon={IconWallet}
        color="green"
        title="Finanças"
        subtitle="Entradas e saídas da casa"
        action={
          <AddButton
            title="Novo lançamento"
            color="green"
            onSubmit={create}
            fields={[
              { name: "kind", label: "Tipo", type: "select", default: "expense", data: [{ value: "expense", label: "💸 Saída" }, { value: "income", label: "💰 Entrada" }] },
              { name: "description", label: "Descrição", required: true, placeholder: "Ex.: Feira da semana" },
              { name: "amount", label: "Valor", type: "number", required: true, prefix: "R$ " },
              { name: "category", label: "Categoria", type: "select", default: "Mercado", data: CATEGORIES },
              { name: "date", label: "Data", type: "date", default: today(), required: true },
            ]}
          />
        }
      />

      <SimpleGrid cols={3} spacing={{ base: "xs", sm: "md" }} mb="lg">
        {[
          ["Entradas", month.Entradas, "teal"],
          ["Saídas", month.Saídas, "red"],
          ["Saldo", month.Entradas - month.Saídas, month.Entradas - month.Saídas >= 0 ? "teal" : "red"],
        ].map(([label, value, color]) => (
          <Card key={label} p={{ base: "xs", sm: "md" }} radius="lg">
            <Text size="xs" c="dimmed" fw={600}>{label}{mobile ? "" : " no mês"}</Text>
            <Text fz={{ base: 13, xs: 17, sm: 26 }} fw={800} c={color} style={{ whiteSpace: "nowrap" }}>{brl(value)}</Text>
          </Card>
        ))}
      </SimpleGrid>

      <Card p={{ base: "md", sm: "lg" }} mb="lg">
        <Text fw={800} mb="md">Últimos 6 meses</Text>
        <BarChart
          h={220}
          w="100%"
          data={chart}
          dataKey="mes"
          series={[{ name: "Entradas", color: "teal.5" }, { name: "Saídas", color: "red.5" }]}
          valueFormatter={brl}
          tickLine="none"
          gridAxis="y"
          withYAxis={!mobile}
          yAxisProps={{ width: 90 }}
          maxBarWidth={28}
          barProps={{ radius: 8 }}
          withLegend
          legendProps={{ verticalAlign: "bottom" }}
        />
      </Card>

      {loading ? <LoadingList /> : rows.length === 0 ? (
        <EmptyState emoji="💰" title="Sem lançamentos" text="Registre entradas e saídas. Contas pagas entram aqui sozinhas." />
      ) : (
        <Stack gap="md">
          {Object.entries(byDay).map(([day, items]) => (
            <div key={day}>
              <Text fw={700} c="dimmed" size="xs" tt="uppercase" mb={6}>{dayjs(day).format("dddd, D MMM")}</Text>
              <Card p={0}>
                {items.map((t, i) => (
                  <Group key={t.id} px="md" py="sm" justify="space-between" wrap="nowrap" style={{ borderTop: i ? "1px solid var(--mantine-color-default-border)" : undefined }}>
                    <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                      <ThemeIcon radius="xl" variant="light" color={t.kind === "income" ? "teal" : "red"}>
                        {t.kind === "income" ? <IconArrowUpRight size={16} /> : <IconArrowDownRight size={16} />}
                      </ThemeIcon>
                      <div style={{ minWidth: 0 }}>
                        <Text fw={600} size="sm" truncate>{t.description}</Text>
                        <Text size="xs" c="dimmed">{t.category}</Text>
                      </div>
                    </Group>
                    <Group gap={4} wrap="nowrap">
                      <Text fw={800} c={t.kind === "income" ? "teal" : "red"} style={{ whiteSpace: "nowrap" }} fz={{ base: "sm", sm: "md" }}>{t.kind === "income" ? "+" : "−"} {brl(t.amount)}</Text>
                      <ActionIcon variant="subtle" color="gray" onClick={() => confirmDelete(t.description, () => remove(t.id))}><IconTrash size={14} /></ActionIcon>
                    </Group>
                  </Group>
                ))}
              </Card>
            </div>
          ))}
        </Stack>
      )}
    </>
  );
}
