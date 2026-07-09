#!/bin/sh
# Storia — Narrative Intelligence Platform Agent Skill Installer
# Symlinks Storia into the agent skills directories

set -e

SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"

# Install for opencode / agent skills
AGENT_DIR="${HOME}/.agents/skills"
mkdir -p "${AGENT_DIR}"
if [ -d "${AGENT_DIR}/storia" ] || [ -L "${AGENT_DIR}/storia" ]; then
  echo "Updating existing Storia installation at ${AGENT_DIR}/storia"
  rm -f "${AGENT_DIR}/storia"
fi
ln -sf "${SKILL_DIR}" "${AGENT_DIR}/storia"
echo "Storia installed at ${AGENT_DIR}/storia"

echo ""
echo "Storia is ready. Any compatible LLM can now discover the skill."
echo "Start a story by saying: 'start a new story with Storia'"
