import { ActionIcon, Badge, Button, Card, Checkbox, Group, Progress, Stack, Text } from "@mantine/core";
import { IconBasket, IconTrash } from "@tabler/icons-react";
import { api, useResource } from "../api.js";
import { AddButton, EmptyState, LoadingList, PageHeader, confirmDelete } from "../components/ui.jsx";

export default function Shopping() {
  const { rows, loading, create, patch, remove, run } = useResource("shopping");
  const pending = rows.filter((r) => !r.done);
  const done = rows.filter((r) => r.done);

  // agrupa os pendentes por categoria, como os corredores do mercado
  const groups = pending.reduce((acc, r) => ((acc[r.category] ||= []).push(r), acc), {});

  const clearDone = run(async () => {
    await Promise.all(done.map((r) => api.remove("shopping", r.id)));
  }, "Lista limpa ✨");

  return (
    <>
      <PageHeader
        icon={IconBasket}
        color="orange"
        title="Lista de compras"
        subtitle={rows.length ? `${done.length} de ${rows.length} no carrinho` : "Tudo que falta em casa"}
        action={
          <AddButton
            title="Novo item"
            color="orange"
            onSubmit={create}
            fields={[
              { name: "name", label: "O que comprar?", required: true, placeholder: "Ex.: Leite" },
              { name: "quantity", label: "Quantidade", type: "number", default: 1 },
              { name: "unit", label: "Unidade", type: "select", default: "un", data: ["un", "kg", "g", "L", "ml", "pct", "cx", "dz"] },
              { name: "category", label: "Seção", type: "select", default: "Mercearia", data: ["Mercearia", "Hortifruti", "Açougue", "Laticínios", "Padaria", "Bebidas", "Limpeza", "Higiene", "Pet", "Outros"] },
            ]}
          />
        }
      />

      {rows.length > 0 && <Progress value={(done.length / rows.length) * 100} color="orange" size="lg" radius="xl" mb="lg" animated={pending.length > 0} />}

      {loading ? <LoadingList /> : rows.length === 0 ? (
        <EmptyState emoji="🛒" title="Lista vazia" text="Adicione itens aqui ou gere a lista automaticamente pela Despensa." />
      ) : (
        <Stack gap="lg">
          {Object.entries(groups).map(([cat, items]) => (
            <div key={cat}>
              <Text fw={700} c="dimmed" size="xs" tt="uppercase" mb={6}>{cat}</Text>
              <Card p={0}>
                {items.map((r, i) => (
                  <Group key={r.id} px="md" py="sm" justify="space-between" wrap="nowrap" style={{ borderTop: i ? "1px solid var(--mantine-color-default-border)" : undefined }}>
                    <Checkbox
                      size="md"
                      radius="xl"
                      color="orange"
                      checked={r.done}
                      onChange={() => patch(r.id, { done: true })}
                      label={<Text fw={600}>{r.name}</Text>}
                    />
                    <Badge variant="light" color="orange" size="lg">{r.quantity} {r.unit}</Badge>
                  </Group>
                ))}
              </Card>
            </div>
          ))}

          {done.length > 0 && (
            <div>
              <Group justify="space-between" mb={6}>
                <Text fw={700} c="dimmed" size="xs" tt="uppercase">No carrinho ✓</Text>
                <Button variant="subtle" color="gray" size="compact-sm" onClick={clearDone}>Limpar</Button>
              </Group>
              <Card p={0}>
                {done.map((r, i) => (
                  <Group key={r.id} px="md" py="xs" justify="space-between" className="done" wrap="nowrap" style={{ borderTop: i ? "1px solid var(--mantine-color-default-border)" : undefined }}>
                    <Checkbox radius="xl" color="orange" checked onChange={() => patch(r.id, { done: false })} label={<Text className="strike">{r.name}</Text>} />
                    <ActionIcon variant="subtle" color="gray" onClick={() => confirmDelete(r.name, () => remove(r.id))}><IconTrash size={16} /></ActionIcon>
                  </Group>
                ))}
              </Card>
            </div>
          )}
        </Stack>
      )}
    </>
  );
}
