"""add trading_mode, pending_trades, autopilot_paused

Revision ID: 7a1f3c9d2b44
Revises: 0509f9badea8
Create Date: 2026-07-13 18:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a1f3c9d2b44'
down_revision: Union[str, None] = '0509f9badea8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'ai_engine_config',
        sa.Column('autopilot_paused', sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        'users',
        sa.Column(
            'trading_mode',
            sa.Enum('manual', 'assisted', 'autonomous', name='tradingmode'),
            nullable=False,
            server_default='manual',
        ),
    )
    op.execute(
        "UPDATE users SET trading_mode = 'autonomous' WHERE auto_trade_enabled IS TRUE"
    )
    op.create_table(
        'pending_trades',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('symbol', sa.String(length=20), nullable=False),
        sa.Column('side', sa.Enum('BUY', 'SELL', name='tradeside'), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('risk_level', sa.String(length=20), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column(
            'status',
            sa.Enum('pending', 'approved', 'rejected', 'expired', name='pendingtradestatus'),
            nullable=False,
            server_default='pending',
        ),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('decided_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_pending_trades_user_id'), 'pending_trades', ['user_id'], unique=False)
    op.create_index(op.f('ix_pending_trades_symbol'), 'pending_trades', ['symbol'], unique=False)
    op.create_index(op.f('ix_pending_trades_created_at'), 'pending_trades', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_pending_trades_created_at'), table_name='pending_trades')
    op.drop_index(op.f('ix_pending_trades_symbol'), table_name='pending_trades')
    op.drop_index(op.f('ix_pending_trades_user_id'), table_name='pending_trades')
    op.drop_table('pending_trades')
    op.drop_column('users', 'trading_mode')
    op.drop_column('ai_engine_config', 'autopilot_paused')
