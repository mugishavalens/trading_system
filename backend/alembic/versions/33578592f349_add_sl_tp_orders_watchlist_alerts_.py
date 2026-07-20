"""add sl/tp/deviation, pending_orders, watchlist_items, price_alerts, notifications

Revision ID: 33578592f349
Revises: b1c2d3e4f5a6
Create Date: 2026-07-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '33578592f349'
down_revision: Union[str, None] = 'b1c2d3e4f5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('positions', sa.Column('stop_loss', sa.Float(), nullable=True))
    op.add_column('positions', sa.Column('take_profit', sa.Float(), nullable=True))

    op.add_column('trades', sa.Column('stop_loss', sa.Float(), nullable=True))
    op.add_column('trades', sa.Column('take_profit', sa.Float(), nullable=True))
    op.add_column('trades', sa.Column('deviation', sa.Float(), nullable=True))

    op.create_table(
        'pending_orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('symbol', sa.String(length=20), nullable=False),
        sa.Column('side', sa.Enum('BUY', 'SELL', name='tradeside'), nullable=False),
        sa.Column('order_type', sa.Enum('limit', 'stop', name='ordertype'), nullable=False),
        sa.Column('trigger_price', sa.Float(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('stop_loss', sa.Float(), nullable=True),
        sa.Column('take_profit', sa.Float(), nullable=True),
        sa.Column('deviation', sa.Float(), nullable=True),
        sa.Column(
            'status',
            sa.Enum('open', 'filled', 'cancelled', 'expired', name='orderstatus'),
            nullable=False,
            server_default='open',
        ),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('filled_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_pending_orders_user_id'), 'pending_orders', ['user_id'], unique=False)
    op.create_index(op.f('ix_pending_orders_symbol'), 'pending_orders', ['symbol'], unique=False)
    op.create_index(op.f('ix_pending_orders_created_at'), 'pending_orders', ['created_at'], unique=False)

    op.create_table(
        'watchlist_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('symbol', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_watchlist_items_user_id'), 'watchlist_items', ['user_id'], unique=False)
    op.create_index(op.f('ix_watchlist_items_symbol'), 'watchlist_items', ['symbol'], unique=False)

    op.create_table(
        'price_alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('symbol', sa.String(length=20), nullable=False),
        sa.Column('condition', sa.Enum('above', 'below', name='alertcondition'), nullable=False),
        sa.Column('target_price', sa.Float(), nullable=False),
        sa.Column(
            'status',
            sa.Enum('active', 'triggered', 'cancelled', name='alertstatus'),
            nullable=False,
            server_default='active',
        ),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('triggered_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_price_alerts_user_id'), 'price_alerts', ['user_id'], unique=False)
    op.create_index(op.f('ix_price_alerts_symbol'), 'price_alerts', ['symbol'], unique=False)

    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column(
            'type',
            sa.Enum(
                'order_filled', 'sl_tp_triggered', 'price_alert',
                'pending_trade_proposed', 'autopilot_trade',
                name='notificationtype',
            ),
            nullable=False,
        ),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)
    op.create_index(op.f('ix_notifications_created_at'), 'notifications', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_notifications_created_at'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_table('notifications')

    op.drop_index(op.f('ix_price_alerts_symbol'), table_name='price_alerts')
    op.drop_index(op.f('ix_price_alerts_user_id'), table_name='price_alerts')
    op.drop_table('price_alerts')

    op.drop_index(op.f('ix_watchlist_items_symbol'), table_name='watchlist_items')
    op.drop_index(op.f('ix_watchlist_items_user_id'), table_name='watchlist_items')
    op.drop_table('watchlist_items')

    op.drop_index(op.f('ix_pending_orders_created_at'), table_name='pending_orders')
    op.drop_index(op.f('ix_pending_orders_symbol'), table_name='pending_orders')
    op.drop_index(op.f('ix_pending_orders_user_id'), table_name='pending_orders')
    op.drop_table('pending_orders')

    op.drop_column('trades', 'deviation')
    op.drop_column('trades', 'take_profit')
    op.drop_column('trades', 'stop_loss')

    op.drop_column('positions', 'take_profit')
    op.drop_column('positions', 'stop_loss')
