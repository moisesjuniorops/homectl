import { useState } from "react";
import { ActionIcon, Badge, Button, Card, Group, Progress, SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import { IconMinus, IconPackage, IconPlus, IconSearch, IconShoppingCartPlus, IconTrash } from "@tabler/icons-react";
import { api, daysUntil, fmtDate, notifyError, notifyOk, useResource } from "../api.js";
import { AddButton, EmptyState, LoadingList, PageHeader, confirmDelete } from "../components/ui.jsx";

const EMOJI = { Mercearia: "🥫", Hortifruti: "🥦", Laticínios: "🧀", Açougue: "🥩", Bebidas: "🧃", Limpeza: "🧽", Higiene: "🧴", Pet: "🐾", Padaria: "🍞" };

export default function Inventory() {
  const { rows, loading, create, patch, remove } = useResource("inventory");
  const [q, setQ] = useState("");

  const list = rows.filter((r) => `${r.name} ${r.category} ${r.location}`.toLowerCase().includes(q.toLowerCase()));

  const restock = async () => {
    try {
      const { added } = await api.action("/inventory/restock-list");
      notifyOk(added.length ? `Na lista de compras: ${added.join(", ")}` : "Nada novo para comprar 👍");
    } catch (e) {
      notifyError(e);
    }
  };

  return (
    <>
      <PageHeader
        icon={IconPackage}
        color="cyan"
        title="Despensa"
        subtitle={`${rows.length} itens em casa`}
        action={
          <AddButton
            title="Novo item na despensa"
            color="cyan"
            onSubmit={create}
            fields={[
              { name: "name", label: "Item", required: true, placeholder: "Ex.: Arroz" },
              { name: "category", label: "Categoria", type: "select", default: "Mercearia", data: Object.keys(EMOJI) },
              { name: "quantity", label: "Quantidade atual", type: "number", default: 1 },
              { name: "unit", label: "Unidade", type: "select", default: "un", data: ["un", "kg", "g", "L", "ml", "pct", "cx"] },
              { name: "min_quantity", label: "Avisar quando tiver menos de", type: "number", default: 1 },
              { name: "location", label: "Onde fica", type: "select", default: "Despensa", data: ["Despensa", "Geladeira", "Freezer", "Lavanderia", "Banheiro"] },
              { name: "expires_on", label: "Validade", type: "date" },
            ]}
          />
        }
      />

      <Group mb="lg" gap="sm" wrap="nowrap">
        <TextInput style={{ flex: 1 }} radius="xl" leftSection={<IconSearch size={16} />} placeholder="Buscar item, categoria ou local" value={q} onChange={(e) => setQ(e.currentTarget.value)} />
        <Button variant="light" color="orange" leftSection={<IconShoppingCartPlus size={18} />} onClick={restock}>
          <Text visibleFrom="xs" span inherit>Gerar compras</Text>
          <Text hiddenFrom="xs" span inherit>Compras</Text>
        </Button>
      </Group>

      {loading ? <LoadingList n={6} h={150} /> : list.length === 0 ? (
        <EmptyState emoji="📦" title="Despensa vazia" text="Cadastre o que tem em casa e defina o mínimo para receber avisos." />
      ) : (
        <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }}>
          {list.map((r) => {
            const low = r.quantity < r.min_quantity;
            const pct = r.min_quantity > 0 ? Math.min(100, (r.quantity / (r.min_quantity * 2)) * 100) : 100;
            const d = r.expires_on ? daysUntil(r.expires_on) : null;
            return (
              <Card key={r.id} p="md" className="lift" style={low ? { borderColor: "var(--mantine-color-red-4)" } : undefined}>
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                  <Group gap="sm" wrap="nowrap">
                    <Text fz={30} lh={1}>{EMOJI[r.category] || "📦"}</Text>
                    <div>
                      <Text fw={700} lh={1.2}>{r.name}</Text>
                      <Text size="xs" c="dimmed">{r.location}</Text>
                    </div>
                  </Group>
                  <ActionIcon variant="subtle" color="gray" onClick={() => confirmDelete(r.name, () => remove(r.id))}><IconTrash size={16} /></ActionIcon>
                </Group>

                <Group justify="space-between" mt="md" wrap="nowrap">
                  <ActionIcon size="lg" radius="xl" variant="light" color="cyan" onClick={() => patch(r.id, { quantity: Math.max(0, r.quantity - 1) })} aria-label="Menos"><IconMinus size={18} /></ActionIcon>
                  <Stack gap={0} align="center">
                    <Text fz={24} fw={800} lh={1}>{r.quantity}</Text>
                    <Text size="xs" c="dimmed">{r.unit}</Text>
                  </Stack>
                  <ActionIcon size="lg" radius="xl" variant="light" color="cyan" onClick={() => patch(r.id, { quantity: r.quantity + 1 })} aria-label="Mais"><IconPlus size={18} /></ActionIcon>
                </Group>

                <Progress value={pct} color={low ? "red" : pct < 75 ? "yellow" : "teal"} size="sm" radius="xl" mt="md" />
                <Group gap={6} mt="xs">
                  {low && <Badge color="red" variant="light">acabando</Badge>}
                  {d !== null && <Badge color={d < 0 ? "red" : d <= 7 ? "yellow" : "gray"} variant="light">{d < 0 ? "vencido" : `vence ${fmtDate(r.expires_on)}`}</Badge>}
                </Group>
              </Card>
            );
          })}
        </SimpleGrid>
      )}
    </>
  );
}
