cat > /app/index.js << 'ENDOFFILE'
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

const CATEGORIA_ABERTOS  = '1497679326383181955';
const CATEGORIA_FECHADOS = 'ID_DA_CATEGORIA_FECHADOS';
const CANAL_LOGS         = '1497679375540289596';
const CANAL_PAINEL       = '1498318862050001056';
const CARGO_STAFF        = '1497002956824907916';

client.once('ready', async () => {
  console.log('Bot online como ' + client.user.tag);

  const canal = client.channels.cache.get(CANAL_PAINEL);
  if (!canal) return console.error('Canal painel nao encontrado!');

  const menu = new StringSelectMenuBuilder()
    .setCustomId('menu_ticket')
    .setPlaceholder('Escolha o tipo de ticket')
    .addOptions([
      { label: 'Bug',        value: 'bug'         },
      { label: 'Compra',     value: 'compra'      },
      { label: 'Ajuda',      value: 'ajuda'       },
      { label: 'Audiovisual',value: 'audiovisual' },
      { label: 'Design',     value: 'design'      }
    ]);

  await canal.send({
    content: 'Selecione o tipo de atendimento:',
    components: [new ActionRowBuilder().addComponents(menu)]
  });
});

function isStaff(member) {
  return member.roles.cache.has(CARGO_STAFF);
}

client.on('interactionCreate', async (interaction) => {

  if (interaction.isStringSelectMenu() && interaction.customId === 'menu_ticket') {
    const tipo     = interaction.values[0];
    const ticketID = Math.floor(1000 + Math.random() * 9000);

    const canal = await interaction.guild.channels.create({
      name: 'ticket-' + tipo + '-' + ticketID,
      type: ChannelType.GuildText,
      parent: CATEGORIA_ABERTOS,
      topic: interaction.user.id,
      permissionOverwrites: [
        { id: interaction.guild.id, deny:  [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id,  allow: [PermissionsBitField.Flags.ViewChannel] },
        { id: CARGO_STAFF,          allow: [PermissionsBitField.Flags.ViewChannel] }
      ]
    });

    const botoes = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('fechar_ticket').setLabel('Finalizar').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('chamar_usuario').setLabel('Chamar').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('renomear_ticket').setLabel('Renomear').setStyle(ButtonStyle.Secondary)
    );

    await canal.send({
      content: 'Ticket de <@' + interaction.user.id + '> | Tipo: **' + tipo + '**',
      components: [botoes]
    });

    await interaction.reply({ content: 'Ticket criado!', ephemeral: true });
    return;
  }

  if (interaction.isButton()) {

    if (interaction.customId === 'fechar_ticket') {
      if (!isStaff(interaction.member))
        return interaction.reply({ content: 'Apenas staff pode fechar tickets.', ephemeral: true });

      try {
        await interaction.reply('Gerando historico...');

        const fetched = await interaction.channel.messages.fetch({ limit: 100 });
        const sorted  = [...fetched.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);

        let log = 'TRANSCRIPT: #' + interaction.channel.name + '\n';
        log    += 'Fechado em: ' + new Date().toLocaleString('pt-BR') + '\n';
        log    += '------------------------------------------------------------\n\n';

        for (const msg of sorted) {
          const conteudo = msg.content || (msg.attachments.size ? '[arquivo anexado]' : '[sem conteudo]');
          const horario  = new Date(msg.createdTimestamp).toLocaleString('pt-BR');
          log += '[' + horario + '] ' + msg.author.tag + ': ' + conteudo + '\n';
        }

        const buffer = Buffer.from(log, 'utf-8');
        const donoId = interaction.channel.topic;
        const nomeCanal = interaction.channel.name;

        const logChannel = interaction.guild.channels.cache.get(CANAL_LOGS);
        if (logChannel) {
          await logChannel.send({
            content: 'Ticket fechado - <@' + donoId + '> | **' + nomeCanal + '**',
            files: [{ attachment: buffer, name: nomeCanal + '.txt' }]
          });
        }

        try {
          const user = await client.users.fetch(donoId);
          await user.send({
            content: 'Seu ticket **' + nomeCanal + '** foi finalizado. Segue o historico:',
            files: [{ attachment: buffer, name: nomeCanal + '.txt' }]
          });
        } catch (e) {
          console.warn('DM falhou:', e.message);
        }

        await interaction.channel.setParent(CATEGORIA_FECHADOS, { lockPermissions: false });
        await interaction.channel.setName('fechado-' + nomeCanal);

        setTimeout(() => interaction.channel.delete().catch(console.error), 5000);

      } catch (err) {
        console.error('ERRO ao fechar ticket:', err);
        await interaction.followUp({ content: 'Erro ao fechar o ticket.', ephemeral: true });
      }
      return;
    }

    if (interaction.customId === 'chamar_usuario') {
      if (!isStaff(interaction.member))
        return interaction.reply({ content: 'Apenas a equipe pode fazer isso.', ephemeral: true });

      const donoId = interaction.channel.topic;
      try {
        const user = await client.users.fetch(donoId);
        await user.send('Voce foi chamado no seu ticket! Volte ao servidor.');
        await interaction.reply({ content: 'Usuario notificado por DM.', ephemeral: true });
      } catch {
        await interaction.reply({ content: 'Nao consegui enviar DM.', ephemeral: true });
      }
      return;
    }

    if (interaction.customId === 'renomear_ticket') {
      if (!isStaff(interaction.member))
        return interaction.reply({ content: 'Apenas a equipe pode fazer isso.', ephemeral: true });

      await interaction.reply({ content: 'Use o comando: !renomear novo-nome', ephemeral: true });
      return;
    }
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('!add')) {
    if (!isStaff(message.member)) return;
    const membro = message.mentions.members.first();
    if (!membro) return message.reply('Marca alguem.');
    await message.channel.permissionOverwrites.edit(membro.id, { ViewChannel: true });
    await message.reply(membro.user.tag + ' adicionado ao ticket.');
  }

  if (message.content.startsWith('!renomear')) {
    if (!isStaff(message.member)) return;
    const novoNome = message.content.split(' ').slice(1).join('-');
    if (!novoNome) return message.reply('Coloque um nome. Ex: !renomear vip-compra');
    await message.channel.setName('ticket-' + novoNome);
    await message.reply('Nome alterado!');
  }
});

client.login(TOKEN);
ENDOFFILE
