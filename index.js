const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.MEU_TOKEN;

// 🔧 CONFIGURAÇÃO
const CATEGORIA_ABERTOS   = '1497679326383181955';
const CATEGORIA_FECHADOS  = '1497679375540289596'; // 👈 coloque o ID real aqui
const CANAL_LOGS          = '1497679375540289596';
const CANAL_PAINEL        = '1498318862050001056';
const CARGO_STAFF         = '1497002956824907916';

client.once('ready', async () => {
  console.log(`Bot online como ${client.user.tag}`);

  const canal = client.channels.cache.get(CANAL_PAINEL);

  const menu = new StringSelectMenuBuilder()
    .setCustomId('menu_ticket')
    .setPlaceholder('Escolha o tipo de ticket')
    .addOptions([
      { label: '🐛 Bug',        value: 'bug'        },
      { label: '💰 Compra',     value: 'compra'     },
      { label: '❓ Ajuda',      value: 'ajuda'      },
      { label: '🎬 Audiovisual',value: 'audiovisual'},
      { label: '🎨 Design',     value: 'design'     }
    ]);

  const row = new ActionRowBuilder().addComponents(menu);

  await canal.send({
    content: '🎫 Selecione o tipo de atendimento:',
    components: [row]
  });
});

function isStaff(member) {
  return member.roles.cache.has(CARGO_STAFF);
}

client.on('interactionCreate', async (interaction) => {

  // ── MENU ──────────────────────────────────────────────────────────────────
  if (interaction.isStringSelectMenu() && interaction.customId === 'menu_ticket') {
    const tipo     = interaction.values[0];
    const ticketID = Math.floor(1000 + Math.random() * 9000);

    const canal = await interaction.guild.channels.create({
      name: `ticket-${tipo}-${ticketID}`,
      type: ChannelType.GuildText,
      parent: CATEGORIA_ABERTOS,
      topic: interaction.user.id,
      permissionOverwrites: [
        { id: interaction.guild.id,   deny:  [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id,    allow: [PermissionsBitField.Flags.ViewChannel] },
        { id: CARGO_STAFF,            allow: [PermissionsBitField.Flags.ViewChannel] }
      ]
    });

    const botoes = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('fechar_ticket')
        .setLabel('🔒 Finalizar')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('chamar_usuario')
        .setLabel('📢 Chamar')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('renomear_ticket')
        .setLabel('✏️ Renomear')
        .setStyle(ButtonStyle.Secondary)
    );

    await canal.send({
      content: `🎫 Ticket de <@${interaction.user.id}> | Tipo: **${tipo}**`,
      components: [botoes]
    });

    await interaction.reply({ content: '✅ Ticket criado!', ephemeral: true });
  }

  // ── BOTÕES ────────────────────────────────────────────────────────────────
  if (interaction.isButton()) {

    // 🔒 FECHAR (SÓ STAFF)
    if (interaction.customId === 'fechar_ticket') {
      if (!isStaff(interaction.member))
        return interaction.reply({ content: '❌ Apenas staff pode fechar tickets.', ephemeral: true });

      try {
        await interaction.reply('📄 Gerando histórico...');

        // Busca mensagens e ordena por horário
        const fetched = await interaction.channel.messages.fetch({ limit: 100 });
        const sorted  = [...fetched.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);

        // Monta o log formatado
        let log = `📄 TRANSCRIPT DO TICKET: #${interaction.channel.name}\n`;
        log    += `📅 Fechado em: ${new Date().toLocaleString('pt-BR')}\n`;
        log    += `${'─'.repeat(60)}\n\n`;

        for (const msg of sorted) {
          // Pula mensagens sem conteúdo de texto (ex: só embed/attachment sem texto)
          const conteudo = msg.content || (msg.attachments.size ? '[arquivo anexado]' : '[sem conteúdo]');
          const horario  = new Date(msg.createdTimestamp).toLocaleString('pt-BR');
          log += `[${horario}] ${msg.author.tag}: ${conteudo}\n`;
        }

        const buffer = Buffer.from(log, 'utf-8');
        const donoId = interaction.channel.topic;

        // Envia no canal de logs ✅ (sem o dois-pontos errado)
        const logChannel = interaction.guild.channels.cache.get(CANAL_LOGS);
        if (logChannel) {
          await logChannel.send({
            content: `📄 Ticket fechado — aberto por <@${donoId}> | Canal: **${interaction.channel.name}**`,
            files: [{ attachment: buffer, name: `${interaction.channel.name}.txt` }]
          });
        } else {
          console.warn('Canal de log não encontrado:', CANAL_LOGS);
        }

        // DM pro dono do ticket com log formatado
        try {
          const user = await client.users.fetch(donoId);
          await user.send({
            content: `📄 Seu ticket **${interaction.channel.name}** foi finalizado. Segue o histórico:`,
            files: [{ attachment: buffer, name: `${interaction.channel.name}.txt` }]
          });
        } catch (e) {
          console.warn('Não foi possível enviar DM:', e.message);
        }

        // Move para categoria de fechados antes de deletar
        await interaction.channel.setParent(CATEGORIA_FECHADOS, { lockPermissions: false });
        await interaction.channel.setName(`fechado-${interaction.channel.name}`);

        // Deleta após 5 segundos
        setTimeout(() => interaction.channel.delete().catch(console.error), 5000);

      } catch (err) {
        console.error('ERRO ao fechar ticket:', err);
        interaction.followUp({ content: '❌ Erro ao fechar o ticket.', ephemeral: true });
      }
    }

    // 📢 CHAMAR (SÓ STAFF)
    if (interaction.customId === 'chamar_usuario') {
      if (!isStaff(interaction.member))
        return interaction.reply({ content: '❌ Apenas a equipe pode fazer isso.', ephemeral: true });

      const donoId = interaction.channel.topic;
      try {
        const user = await client.users.fetch(donoId);
        await user.send('📢 Você foi chamado no seu ticket! Volte ao servidor.');
        await interaction.reply({ content: '✅ Usuário notificado por DM.', ephemeral: true });
      } catch {
        await interaction.reply({ content: '❌ Não consegui enviar DM para o usuário.', ephemeral: true });
      }
    }

    // ✏️ RENOMEAR (SÓ STAFF)
    if (interaction.customId === 'renomear_ticket') {
      if (!isStaff(interaction.member))
        return interaction.reply({ content: '❌ Apenas a equipe pode fazer isso.', ephemeral: true });

      await interaction.reply({ content: 'Use o comando: `!renomear novo-nome`', ephemeral: true });
    }
  }
});

// ── COMANDOS DE TEXTO ──────────────────────────────────────────────────────
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // !add @membro
  if (message.content.startsWith('!add')) {
    if (!isStaff(message.member)) return;
    const membro = message.mentions.members.first();
    if (!membro) return message.reply('Marca alguém.');
    await message.channel.permissionOverwrites.edit(membro.id, { ViewChannel: true });
    await message.reply(`✅ ${membro.user.tag} adicionado ao ticket.`);
  }

  // !renomear novo-nome
  if (message.content.startsWith('!renomear')) {
    if (!isStaff(message.member)) return;
    const novoNome = message.content.split(' ').slice(1).join('-');
    if (!novoNome) return message.reply('Coloque um nome. Ex: `!renomear vip-compra`');
    await message.channel.setName(`ticket-${novoNome}`);
    await message.reply('✅ Nome alterado!');
  }
});

client.login(TOKEN);
